import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { WorkspaceQueryService } from './workspace-query.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';

import { Workspace } from '../entities/workspace.entity';
import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { GetUserWorkspaceResponse, WorkspacePlan } from '../interfaces/workspace.interface';

@Injectable()
export class WorkspaceMembershipService {
  private readonly logger = new Logger(WorkspaceMembershipService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly workspaceQueryService: WorkspaceQueryService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    private readonly tokenManager: TokenManager,
  ) {}

  /**
   * Check if user can manage workspace (owner or admin)
   */
  async canUserManageWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) return false;

    // Owner can always manage
    if (workspace.createdBy === userId) return true;

    // Check if user is admin
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;
    try {
      const [result] = await this.dataSource.query(
        `SELECT role FROM "${schemaName}".members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`,
        [userId],
      );

      return result && (result.role === 'admin' || result.role === 'owner');
    } catch (error) {
      return false;
    }
  }

  /**
   * Count workspaces owned by user
   */
  async countUserWorkspaces(userId: string): Promise<number> {
    return this.workspaceRepo.count({
      where: { createdBy: userId, isActive: true },
    });
  }

  /**
   * Get a single workspace for a user (with membership check)
   */
  async getUserSingleWorkspace(
    workspaceId: string,
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspaceResponse> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Get workspace from public schema
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('No workspace with this Id was found');
    }

    if (!workspace.isActive) {
      throw customError.notFound('This workspace is not active');
    }

    // Check if user is a member of this workspace
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const [member] = await this.dataSource.query(
        `SELECT 1 FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`,
        [user.id],
      );

      if (!member) {
        throw customError.forbidden('You are not a member of this workspace');
      }
    } catch (error) {
      // If it's already a custom error, rethrow it
      if (error.statusCode) {
        throw error;
      }
      // Otherwise, schema might not exist or be accessible
      this.logger.warn(
        `Failed to check membership in schema ${schemaName}: ${error.message}`,
      );
      throw customError.forbidden('You are not a member of this workspace');
    }

    // Get workspace with safe user fields
    const workspaceWithSafeFields =
      await this.workspaceQueryService.findWorkspaceWithSafeFields(workspaceId);

    if (!workspaceWithSafeFields) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      workspace: workspaceWithSafeFields,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace fetched successfully',
    };
  }

  /**
   * Count free plan workspaces owned by user
   */
  async countUserFreeWorkspaces(userId: string): Promise<number> {
    return this.workspaceRepo.count({
      where: {
        createdBy: userId,
        isActive: true,
        plan: WorkspacePlan.FREE,
      },
    });
  }
  /**
   * Get max workspaces allowed for user
   */
  getMaxWorkspacesForUser(user: User): number {
    // This could be based on user's subscription
    // For now, simple logic:
    return 10; // Default limit
  }

  getMemberProfile(member: WorkspaceMember): Partial<WorkspaceMember> {
    return this.memberService.getMemberProfile(member);
  }
}
