import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { customError } from 'src/core/error-handler/custom-errors';
import {
  WorkspacePlan,
  UpdateWorkspaceResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceQueryService } from './workspace-query.service';

@Injectable()
export class WorkspaceLifecycleService {
  private readonly logger = new Logger(WorkspaceLifecycleService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tokenManager: TokenManager,
    private readonly workspaceMembershipService: WorkspaceMembershipService,
    private readonly workspaceQueryService: WorkspaceQueryService,
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
    const userWorkspaceCount =
      await this.workspaceMembershipService.countUserWorkspaces(user.id);
    const maxWorkspaces =
      this.workspaceMembershipService.getMaxWorkspacesForUser(user);

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
    if (!this.workspaceQueryService.isValidSlug(createDto.slug)) {
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
      await this.workspaceMembershipService.addOwnerMember(
        workspace.id,
        workspace.slug,
        user.id,
        queryRunner,
      );

      // 9. Create default channels
      await this.createDefaultChannels(workspace.slug, user.id, queryRunner);

      // 10. Commit transaction
      await queryRunner.commitTransaction();
      const savedWorkspace =
        await this.workspaceQueryService.findWorkspaceWithSafeFields(
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

  /**
   * Create workspace schema in database
   */
  private async createWorkspaceSchema(
    slug: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    // Create schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Members table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      role VARCHAR(50) NOT NULL,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      joined_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_members_user UNIQUE (user_id),
      CONSTRAINT chk_${schemaName}_members_permissions_array
        CHECK (jsonb_typeof(permissions) = 'array')
    )
  `);

    await queryRunner.query(`
    CREATE INDEX idx_${schemaName}_members_user_id
    ON "${schemaName}".members(user_id)
  `);

    // Channels table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_private BOOLEAN DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Channel members table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".channel_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_channel_members UNIQUE (channel_id, member_id)
    )
  `);

    // Messages table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      content TEXT NOT NULL,
      thread_id UUID
        REFERENCES "${schemaName}".messages(id),
      is_edited BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

    await queryRunner.query(`
    CREATE INDEX idx_${schemaName}_messages_channel
    ON "${schemaName}".messages(channel_id)
  `);

    // Files table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100),
      storage_key VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Reactions table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL
        REFERENCES "${schemaName}".messages(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      emoji VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_reactions UNIQUE (message_id, member_id, emoji)
    )
  `);

    this.logger.log(`Schema created: ${schemaName}`);
  }
  /**
   * Create default channels (#general, #random)
   */
  private async createDefaultChannels(
    slug: string,
    creatorUserId: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    // Get member ID
    const [member] = await queryRunner.query(
      `SELECT id FROM "${schemaName}".members WHERE user_id = $1`,
      [creatorUserId],
    );

    if (!member) {
      throw new Error(
        `Workspace member not found for user ${creatorUserId} in ${schemaName}`,
      );
    }

    // Create #general channel
    const [generalChannel] = await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('general', 'General discussion', false, $1)
    RETURNING id
  `,
      [member.id],
    );

    // Create #random channel
    const [randomChannel] = await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('random', 'Random chat', false, $1)
    RETURNING id
  `,
      [member.id],
    );

    // Add creator to both channels
    await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channel_members (channel_id, member_id)
    VALUES ($1, $2), ($3, $2)
  `,
      [generalChannel.id, member.id, randomChannel.id],
    );

    this.logger.log(`Default channels created in ${schemaName}`);
  }
}