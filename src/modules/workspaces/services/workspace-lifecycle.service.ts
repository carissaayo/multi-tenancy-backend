import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { customError } from 'src/core/error-handler/custom-errors';
import {
  GetUserWorkspacesResponse,
  GetUserWorkspaceResponse,
  WorkspacePlan,
  UpdateWorkspaceResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { RolePermissions } from 'src/core/security/interfaces/permission.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tokenManager: TokenManager,
    private storageService: AWSStorageService,
  ) {}

  /**
   * Create a new workspace
   * - Creates workspace record in public schema
   * - Creates workspace schema in database
   * - Creates default channels (#general, #random)
   * - Makes creator the owner
   */
  async create(
    req: AuthenticatedRequest,
    createDto: CreateWorkspaceDto,
  ): Promise<{
    workspace: Workspace | null;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // 2. Check workspace limit per user
    const userWorkspaceCount = await this.countUserWorkspaces(user.id);
    const maxWorkspaces = this.getMaxWorkspacesForUser(user);

    if (userWorkspaceCount >= maxWorkspaces) {
      throw customError.forbidden(
        `Maximum workspace limit (${maxWorkspaces}) reached`,
      );
    }

    // 3. Validate slug is available
    const slugExists = await this.workspaceRepo.findOne({
      where: { slug: createDto.slug },
    });

    if (slugExists) {
      throw customError.conflict('Workspace slug already taken');
    }

    // 4. Validate slug format
    if (!this.isValidSlug(createDto.slug)) {
      throw customError.badRequest(
        'Slug must be lowercase alphanumeric with hyphens only',
      );
    }

    // 5. Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 6. Create workspace record
      const workspace = this.workspaceRepo.create({
        ...createDto,
        plan: createDto.plan || WorkspacePlan.FREE,
        ownerId: user.id,
        owner: user,
        creator: user,
        createdBy: user.id,

        isActive: true,
        settings: {
          allowInvites: true,
          requireApproval: false,
          defaultChannelAccess: 'all',
        },
      });

      await queryRunner.manager.save(workspace);

      // 7. Create workspace schema in database
      await this.createWorkspaceSchema(workspace.slug, queryRunner);

      // 8. Add creator as owner member
      await this.addOwnerMember(
        workspace.id,
        workspace.slug,
        user.id,
        queryRunner,
      );

      // 9. Create default channels
      await this.createDefaultChannels(workspace.slug, user.id, queryRunner);

      // 10. Commit transaction
      await queryRunner.commitTransaction();
      const savedWorkspace = await this.findWorkspaceWithSafeFields(
        workspace.id,
      );

      this.logger.log(
        `✅ Workspace created: ${workspace.slug} by user ${user.id}`,
      );
      const tokens = await this.tokenManager.signTokens(user, req);

      return {
        workspace: savedWorkspace,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        message: 'Workspace created successfully',
      };
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update workspace
   */
  async updateWorkspaceProperties(
    workspaceId: string,
    req: AuthenticatedRequest,
    updateDto: UpdateWorkspaceDto,
  ): Promise<UpdateWorkspaceResponse> {
    console.log(workspaceId);

    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
    const workspace = await this.findById(workspaceId);

    // Check user is owner or admin
    const canUpdate = await this.canUserManageWorkspace(workspaceId, user.id);
    if (!canUpdate) {
      throw customError.forbidden(
        'Only workspace owners and admins can update workspace',
      );
    }

    // Update workspace
    Object.assign(workspace, updateDto);
    workspace.updatedAt = new Date();

    const savedWorkspace = await this.workspaceRepo.save(workspace);
    const workspaceWithSafeFields = await this.findWorkspaceWithSafeFields(
      savedWorkspace.id,
    );
    if (!workspaceWithSafeFields) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      workspace: workspaceWithSafeFields,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace updated successfully',
    };
  }

  /**
   * Soft delete workspace (deactivate)
   */
  async deactivate(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findById(workspaceId);

    // Only owner can deactivate
    if (workspace.createdBy !== userId) {
      throw customError.forbidden(
        'Only workspace owner can deactivate workspace',
      );
    }

    workspace.isActive = false;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(`Workspace deactivated: ${workspace.slug}`);
  }

  /**
   * Permanently delete workspace (dangerous!)
   */
  async permanentlyDelete(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findById(workspaceId);

    // Only owner can delete
    if (workspace.createdBy !== userId) {
      throw customError.forbidden('Only workspace owner can delete workspace');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Drop workspace schema (CASCADE removes all tables)
      await queryRunner.query(
        `DROP SCHEMA IF EXISTS workspace_${workspace.slug} CASCADE`,
      );

      // 2. Delete workspace record
      await queryRunner.manager.delete(Workspace, { id: workspaceId });

      await queryRunner.commitTransaction();

      this.logger.warn(`⚠️ Workspace PERMANENTLY deleted: ${workspace.slug}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}