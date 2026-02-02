import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';

import { Workspace } from '../entities/workspace.entity';

import { CreateWorkspaceDto } from '../dtos/workspace.dto';

import {
  GetUserWorkspacesResponse,
  GetUserWorkspaceResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { MessagingGateway } from 'src/modules/messages/gateways/messaging.gateway';
import { TokenManager } from 'src/core/security/services/token-manager.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly workspaceMembershipService: WorkspaceMembershipService,
    private readonly workspaceLifecycleService: WorkspaceLifecycleService,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
    private readonly tokenManager: TokenManager,
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
    file?: Express.Multer.File,
  ): Promise<{
    workspace: Workspace | null;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    console.log(file,"file");
    
    const result = await this.workspaceLifecycleService.create(req, createDto, file);

    // Emit WebSocket event if workspace was created
    if (result.workspace) {
      // Note: Users need to join the workspace room first via WebSocket
      // This event will be received by users who are already connected
      this.messagingGateway.emitToUser(req.userId, 'workspaceCreated', {
        workspace: this.normalizedWorkspaceData(result.workspace),
      });
    }

    return result;
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
   * Count free plan workspaces owned by user
   */
  async countUserFreeWorkspaces(userId: string): Promise<number> {
    return this.workspaceMembershipService.countUserFreeWorkspaces(userId);
  }

  // In WorkspacesService
  async getWorkspaceMembers(
    workspaceId: string,
    req: AuthenticatedRequest,
    options?: {
      limit?: number;
      offset?: number;
      role?: string;
      isActive?: boolean;
    }
  ) {
    const result = await this.workspaceMembershipService.getWorkspaceMembers(
      workspaceId,
      req.userId,
      options,
    );

    const tokens = await this.tokenManager.signTokens(req.user!, req);

    return {
      members: result.members,
      total: result.total,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace members retrieved successfully',
    };
  }

  normalizedWorkspaceData(workspace: Workspace) {
    return {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description,
      logoUrl: workspace.logoUrl,
      plan: workspace.plan,
      isActive: workspace.isActive,
      settings: workspace.settings,
      createdBy: workspace.createdBy,
      creator: workspace.creator
        ? {
            fullName: workspace.creator.fullName,
            avatarUrl: workspace.creator.avatarUrl,
          }
        : null,
      ownerId: workspace.ownerId,
      owner: workspace.owner
        ? {
            fullName: workspace.owner.fullName,
            avatarUrl: workspace.owner.avatarUrl,
          }
        : null,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
