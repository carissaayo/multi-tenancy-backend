import { Injectable } from '@nestjs/common';

import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';

import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';

import { CreateWorkspaceDto } from '../dtos/workspace.dto';

import {
  GetUserWorkspacesResponse,
  GetUserWorkspaceResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@Injectable()
export class WorkspacesService {
  constructor(
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
  async isUserMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
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
   * Count free plan workspaces owned by user
   */
  async countUserFreeWorkspaces(userId: string): Promise<number> {
    return this.workspaceMembershipService.countUserFreeWorkspaces(userId);
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
