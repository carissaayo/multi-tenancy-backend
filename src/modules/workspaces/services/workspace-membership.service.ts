import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';

import { RolePermissions } from 'src/core/security/interfaces/permission.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { User } from 'src/modules/users/entities/user.entity';
import { WorkspaceQueryService } from './workspace-query.service';
import { customError } from 'src/core/error-handler/custom-errors';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { GetUserWorkspaceResponse, WorkspaceInvitationRole, WorkspacePlan } from '../interfaces/workspace.interface';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';

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
    private readonly tokenManager: TokenManager,
  ) {}

  /**
   * Add creator as owner member
   */
  async addOwnerMember(
    workspaceId: string,
    slug: string,
    userId: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    const ownerPermissions = RolePermissions.owner.map((p) => p.toString());

    await queryRunner.query(
      `
    INSERT INTO "${schemaName}".members
      (user_id, role, permissions, is_active, joined_at)
    VALUES ($1, 'owner', $2::jsonb, true, NOW())
    `,
      [userId, JSON.stringify(ownerPermissions)],
    );

    this.logger.log(
      `Owner member added: user ${userId} → workspace ${workspaceId} (${schemaName})`,
    );
  }

  /**
   * Add a new user to workspace
   * @param workspaceId - The workspace ID
   * @param userId - The user ID to add
   * @param role - The role to assign (defaults to 'member')
   * @returns The created workspace member
   */
  async addMemberToWorkspace(
    workspaceId: string,
    userId: string,
    role: WorkspaceInvitationRole,
  ): Promise<WorkspaceMember> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    if (!workspace.isActive) {
      throw customError.badRequest('Workspace is not active');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.isUserMember(workspaceId, userId);
    if (existingMember) {
      throw customError.badRequest(
        'User is already a member of this workspace',
      );
    }

    // Get permissions for the role
    const rolePermissions =
      RolePermissions[role as string] || RolePermissions.member;
    const permissions = rolePermissions.map((p) => p.toString());

    // Sanitize slug and get schema name
    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      // Insert member into workspace-specific schema
      const result = await this.dataSource.query(
        `
      INSERT INTO "${schemaName}".members
        (user_id, role, permissions, is_active, joined_at)
      VALUES ($1, $2, $3::jsonb, true, NOW())
      RETURNING id, user_id, role, permissions, is_active, joined_at
      `,
        [userId, role as string, JSON.stringify(permissions)],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError(
          'Failed to add member to workspace',
        );
      }

      const member = result[0];

      this.logger.log(
        `Member added: user ${userId} → workspace ${workspaceId} (${schemaName}) with role ${role}`,
      );

      // Map the result to WorkspaceMember format
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions,
        isActive: member.is_active,
        joinedAt: member.joined_at,
      } as WorkspaceMember;
    } catch (error) {
      this.logger.error(
        `Error adding member to workspace ${workspaceId}: ${error.message}`,
      );

      // Handle unique constraint violation (user already exists)
      if (error.code === '23505') {
        throw customError.badRequest(
          'User is already a member of this workspace',
        );
      }

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      throw customError.internalServerError(
        'Failed to add member to workspace',
      );
    }
  }
  /**
   * Check if user is member of workspace
   */
  async isUserMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
    try {
      // Use direct query instead of repository to ensure we're querying the correct schema
      const [member] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`,
        [userId],
      );

      if (!member) {
        return null;
      }

      // Map the result to WorkspaceMember format
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions,
        isActive: member.is_active,
        joinedAt: member.joined_at,
      } as WorkspaceMember;
    } catch (error) {
      // Log the error for debugging
      console.error(`Error querying members in schema ${schemaName}:`, error);
      return null;
    } finally {
      // Reset search path
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

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
        `SELECT role FROM ${schemaName}.members 
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
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.joinedAt,
    };
  }
}
