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
import {
  GetUserWorkspaceResponse,
  WorkspaceInvitationRole,
  WorkspacePlan,
} from '../interfaces/workspace.interface';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { ChangeMemberRoleDto } from '../dtos/workspace-management.dto';

@Injectable()
export class WorkspaceManagementService {
  private readonly logger = new Logger(WorkspaceManagementService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly tokenManager: TokenManager,
    private readonly workspaceMembershipService: WorkspaceMembershipService,
  ) {}

  /**
   * Change member role in workspace
   * Only owner and admins can change roles
   * Owners can change anyone's role
   * Admins can only change regular members' roles (not other admins or owner)
   */
  async changeMemberRole(
    workspaceId: string,
    changeMemberRoleDto: ChangeMemberRoleDto,
    req: AuthenticatedRequest,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const { targetUserId, newRole } = changeMemberRoleDto;

    const user=await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }
    if (!workspace.isActive) {
      throw customError.badRequest('Workspace is not active');
    }
    // Get requester's member record
    const requester = await this.workspaceMembershipService.isUserMember(
      workspaceId,
      user.id,
    );
    if (!requester) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    // Get target member's record
    const targetMember = await this.workspaceMembershipService.isUserMember(
      workspaceId,
      targetUserId,
    );
    if (!targetMember) {
      throw customError.notFound(
        'Target user is not a member of this workspace',
      );
    }

    // Verify target member is active
    if (!targetMember.isActive) {
      throw customError.badRequest('Target member is not active');
    }

    // Permission checks
    const isRequesterOwner =
      workspace.ownerId === user.id || workspace.createdBy === user.id;
    const isRequesterAdmin = requester.role === 'admin';
    const isTargetOwner =
      workspace.ownerId === targetUserId ||
      workspace.createdBy === targetUserId;
    const isTargetAdmin = targetMember.role === 'admin';

    // Cannot change owner's role
    if (isTargetOwner) {
      throw customError.forbidden(
        'Cannot change the role of the workspace owner',
      );
    }

    // Cannot change your own role
    if (user.id === targetUserId) {
      throw customError.forbidden('You cannot change your own role');   
    }

    // Validate that newRole is valid and not 'owner' (not allowed via this method)
    if (
      !Object.values(WorkspaceInvitationRole).includes(newRole) ||
      (newRole as string) === 'owner'
    ) {
      throw customError.badRequest(
        'Invalid role. Owner role cannot be set via role change.',
      );
    }

    // Only owner can promote to admin or change admin roles (including demoting admins)
    if (
      (newRole === WorkspaceInvitationRole.ADMIN || isTargetAdmin) &&
      !isRequesterOwner
    ) {
      throw customError.forbidden(
        'Only the workspace owner can manage admin roles',
      );
    }

    // Non-admin, non-owner cannot change roles
    if (!isRequesterOwner && !isRequesterAdmin) {
      throw customError.forbidden(
        'You do not have permission to change member roles',
      );
    }

    // Get permissions for the new role
    const rolePermissions =
      RolePermissions[newRole as string] || RolePermissions.member;
    const permissions = rolePermissions.map((p) => p.toString());

    const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      // Update member role in workspace schema
      const result = await this.dataSource.query(
        `
      UPDATE "${schemaName}".members
      SET role = $1, permissions = $2::jsonb
      WHERE user_id = $3
      RETURNING id, user_id, role, permissions, is_active, joined_at
      `,
        [newRole as string, JSON.stringify(permissions), targetUserId],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError('Failed to update member role');
      }

      const updatedMember = result[0];

      this.logger.log(
        `Member role changed: user ${targetUserId} → ${newRole} in workspace ${workspaceId} by ${user.id}`,
      );

      const tokens = await this.tokenManager.signTokens(user, req);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        message: 'Member role has been updated successfully',
      };
      
    } catch (error) {
      this.logger.error(
        `Error changing member role in workspace ${workspaceId}: ${error.message}`,
      );

      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to change member role');
    }
  }
}
