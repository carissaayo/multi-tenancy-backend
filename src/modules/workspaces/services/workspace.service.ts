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
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';
import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';

/**
 * Facade service that provides a single entry point for workspace operations.
 * Delegates to specialized services for better separation of concerns.
 */
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
    private readonly storageService: AWSStorageService,
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly workspaceMembershipService: WorkspaceMembershipService,
    private readonly workspaceLifecycleService: WorkspaceLifecycleService,
  ) {}

  // ============================================
  // LIFECYCLE OPERATIONS (delegated to WorkspaceLifecycleService)
  // ============================================

  /**
   * Create a new workspace
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
    return this.workspaceLifecycleService.create(req, createDto);
  }

  /**
   * Update workspace properties
   */
  async updateWorkspaceProperties(
    workspaceId: string,
    req: AuthenticatedRequest,
    updateDto: UpdateWorkspaceDto,
  ): Promise<UpdateWorkspaceResponse> {
    return this.workspaceLifecycleService.updateWorkspaceProperties(
      workspaceId,
      req,
      updateDto,
    );
  }

  /**
   * Upload and update workspace logo
   */
  async updateWorkspaceLogo(
    workspaceId: string,
    req: AuthenticatedRequest,
    file: Express.Multer.File,
  ): Promise<UpdateWorkspaceResponse> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    // Check permissions (owner/admin only)
    const canUpdate =
      await this.workspaceMembershipService.canUserManageWorkspace(
        workspaceId,
        user.id,
      );
    if (!canUpdate) {
      throw customError.forbidden('Insufficient permissions');
    }

    // Delete old logo if exists
    if (workspace.logoUrl) {
      try {
        const oldKey = this.storageService.parseS3Url(workspace.logoUrl);
        await this.storageService.deleteFile(oldKey, workspaceId);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old logo for workspace ${workspaceId}: ${error.message}`,
        );
      }
    }

    // Upload new logo to S3
    const uploadedFile = await this.storageService.uploadFile(file, {
      workspaceId,
      userId: user.id,
      folder: 'logos',
      maxSizeInMB: 5,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp',
      ],
      makePublic: true,
    });

    // Update workspace with new logo URL
    workspace.logoUrl = uploadedFile.url;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(
      `Workspace logo updated: ${workspace.slug} by user ${user.id}`,
    );

    // Return workspace with safe user fields
    const updatedWorkspace =
      await this.workspaceQueryService.findWorkspaceWithSafeFields(workspaceId);
    if (!updatedWorkspace) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      workspace: updatedWorkspace,
      message: 'Workspace Logo has been updated',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  /**
   * Soft delete workspace (deactivate)
   */
  async deactivate(workspaceId: string, userId: string): Promise<void> {
    return this.workspaceLifecycleService.deactivate(workspaceId, userId);
  }

  /**
   * Permanently delete workspace
   */
  async permanentlyDelete(workspaceId: string, userId: string): Promise<void> {
    return this.workspaceLifecycleService.permanentlyDelete(
      workspaceId,
      userId,
    );
  }

  /**
   * Update workspace plan (upgrade/downgrade)
   */
  async updatePlan(
    workspaceId: string,
    userId: string,
    newPlan: WorkspacePlan,
  ): Promise<Workspace> {
    const workspace = await this.workspaceQueryService.findById(workspaceId);

    // Only owner can change plan
    if (workspace.createdBy !== userId) {
      throw customError.forbidden('Only workspace owner can change plan');
    }

    // Validate plan downgrade doesn't exceed limits
    if (newPlan === 'free' && workspace.plan !== 'free') {
      await this.validatePlanDowngrade(workspace);
    }

    workspace.plan = newPlan;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(`Workspace plan updated: ${workspace.slug} → ${newPlan}`);

    return workspace;
  }

  // ============================================
  // QUERY OPERATIONS (delegated to WorkspaceQueryService)
  // ============================================

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspacesResponse> {
    return this.workspaceQueryService.getUserWorkspaces(req);
  }

  /**
   * Get a single workspace for a user (with membership check)
   */
  async getUserSingleWorkspace(
    workspaceId: string,
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspaceResponse> {
    return this.workspaceMembershipService.getUserSingleWorkspace(
      workspaceId,
      req,
    );
  }

  /**
   * Find workspace by slug
   */
  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceQueryService.findBySlug(slug);
  }

  /**
   * Find workspace by ID
   */
  async findById(id: string): Promise<Workspace> {
    return this.workspaceQueryService.findById(id);
  }

  /**
   * Get workspace with safe user fields (excludes sensitive data)
   */
  public async findWorkspaceWithSafeFields(
    identifier: string,
    bySlug: boolean = false,
  ): Promise<Workspace | null> {
    return this.workspaceQueryService.findWorkspaceWithSafeFields(
      identifier,
      bySlug,
    );
  }

  // ============================================
  // MEMBERSHIP OPERATIONS (delegated to WorkspaceMembershipService)
  // ============================================

  /**
   * Check if user is member of workspace
   */
  async isUserMember(workspaceId: string, userId: string): Promise<boolean> {
    return this.workspaceMembershipService.isUserMember(workspaceId, userId);
  }

  /**
   * Check if user can manage workspace (owner or admin)
   */
  async canUserManageWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    return this.workspaceMembershipService.canUserManageWorkspace(
      workspaceId,
      userId,
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Sanitize slug for use in SQL identifiers
   * Replaces hyphens and other special characters with underscores
   */
  public sanitizeSlugForSQL(slug: string): string {
    return this.workspaceQueryService.sanitizeSlugForSQL(slug);
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    memberCount: number;
    channelCount: number;
    messageCount: number;
    fileCount: number;
    storageUsed: number;
  }> {
    const workspace = await this.workspaceQueryService.findById(workspaceId);
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    const [memberCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".members WHERE is_active = true`,
    );

    const [channelCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".channels`,
    );

    const [messageCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".messages`,
    );

    const [fileStats] = await this.dataSource.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size 
       FROM "${schemaName}".files`,
    );

    return {
      memberCount: parseInt(memberCount.count),
      channelCount: parseInt(channelCount.count),
      messageCount: parseInt(messageCount.count),
      fileCount: parseInt(fileStats.count),
      storageUsed: parseInt(fileStats.total_size) / (1024 * 1024), // MB
    };
  }

  /**
   * Validate workspace can be downgraded to free plan
   */
  private async validatePlanDowngrade(workspace: Workspace): Promise<void> {
    const stats = await this.getWorkspaceStats(workspace.id);

    const freeLimits = {
      maxMembers: 10,
      maxStorageMB: 5 * 1024, // 5GB
    };

    if (stats.memberCount > freeLimits.maxMembers) {
      throw customError.badRequest(
        `Cannot downgrade: Free plan allows max ${freeLimits.maxMembers} members`,
      );
    }

    if (stats.storageUsed > freeLimits.maxStorageMB) {
      throw customError.badRequest(
        `Cannot downgrade: Storage exceeds free plan limit`,
      );
    }
  }
}
