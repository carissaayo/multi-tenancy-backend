import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceQueryService } from './workspace-query.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { MemberService } from 'src/modules/members/services/member.service';

import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { User } from 'src/modules/users/entities/user.entity';

import { RolePermissions } from 'src/core/security/interfaces/permission.interface';
import { customError } from 'src/core/error-handler/custom-errors';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { NoDataWorkspaceResponse, WorkspaceInvitationRole } from '../interfaces/workspace.interface';

import { ChangeMemberRoleDto, RemoveUserFromWorkspaceDto } from '../dtos/workspace-management.dto';
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
    private readonly workspaceMembershipService: WorkspaceMembershipService,
    private readonly memberService: MemberService,
    private readonly tokenManager: TokenManager,
  ) {}

  /**
   * Change member role in workspace
   * Only owner and admins can change roles
   * Owners can change anyone's role
   * Admins can only change regular members' roles (not other admins or owner)
   */
  async changeMemberRole(
    changeMemberRoleDto: ChangeMemberRoleDto,
    req: AuthenticatedRequest,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    message: string;
    member: Partial<WorkspaceMember>;
  }> {
    const { targetUserId, newRole } = changeMemberRoleDto;

    const user = await this.userRepo.findOne({ where: { id: req.userId } });

    if (!user) {
      throw customError.notFound('User not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: req.workspaceId! },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }
    if (!workspace.isActive) {
      throw customError.badRequest('Workspace is not active');
    }

    const requester = await this.memberService.isUserMember(
      workspace.id,
      user.id,
    );

    if (!requester) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    const targetMember = await this.memberService.isUserMember(
      workspace.id,
      targetUserId,
    );
    if (!targetMember) {
      throw customError.notFound(
        'Target user is not a member of this workspace',
      );
    }

    const isRequesterOwner =
      workspace.ownerId === user.id || workspace.createdBy === user.id;
    const isRequesterAdmin =
      requester.role === 'admin' || requester.role === 'owner';
    const isTargetOwner =
      workspace.ownerId === targetUserId ||
      workspace.createdBy === targetUserId;
    const isTargetAdmin = targetMember.role === 'admin';
    const isTargetOwnerRole = targetMember.role === 'owner';

    // Cannot change workspace owner's role OR anyone with 'owner' role in members table
    if (isTargetOwner || isTargetOwnerRole) {
      throw customError.forbidden(
        'Cannot change the role of the workspace owner',
      );
    }

    if (user.id === targetUserId) {
      throw customError.forbidden('You cannot change your own role');
    }

    if (!Object.values(WorkspaceInvitationRole).includes(newRole)) {
      throw customError.badRequest(
        'Invalid role. Only admin, member, and guest roles can be changed.',
      );
    }

    if (
      (newRole === WorkspaceInvitationRole.ADMIN ||
        isTargetAdmin ||
        isTargetOwnerRole) &&
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

      this.logger.log(
        `Member role changed: user ${targetUserId} → ${newRole} in workspace ${workspace.id} by ${user.id}`,
      );

      const updatedMember = result[0];
      // Map SQL result to WorkspaceMember format (snake_case -> camelCase)
      const member: WorkspaceMember = {
        id: updatedMember.id,
        userId: updatedMember.user_id,
        role: updatedMember.role,
        permissions: updatedMember.permissions,
        isActive: updatedMember.is_active,
        joinedAt: updatedMember.joined_at,
      } as WorkspaceMember;

      const memberProfile =
        this.workspaceMembershipService.getMemberProfile(member);
      const tokens = await this.tokenManager.signTokens(user, req);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        member: memberProfile,
        message: 'Member role has been updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error changing member role in workspace ${workspace.id}: ${error.message}`,
      );

      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to change member role');
    }
  }

  /**
   * Remove a user from a workspace
   */
  /**
   * Remove a user from a workspace
   */
  async removeUserFromWorkspace(
    dto: RemoveUserFromWorkspaceDto,
    req: AuthenticatedRequest,
  ): Promise<NoDataWorkspaceResponse> {
    const { targetUserId } = dto;
    const user = await this.userRepo.findOne({ where: { id: req.userId } });

    if (!user) {
      throw customError.notFound('User not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: req.workspaceId! },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }



    const canManageWorkspace =
      await this.workspaceMembershipService.canUserManageWorkspace(
        workspace.id,
        user.id,
      );

    if (!canManageWorkspace) {
      throw customError.forbidden(
        'You do not have permission to manage users in this workspace',
      );
    }

    const targetMember = await this.memberService.isUserMember(
      workspace.id,
      targetUserId,
    );
    if (!targetMember) {
      throw customError.notFound(
        'Target user is not a member of this workspace',
      );
    }

    // Cannot remove workspace owner
    const isTargetOwner =
      workspace.ownerId === targetUserId ||
      workspace.createdBy === targetUserId;
    if (isTargetOwner || targetMember.role === 'owner') {
      throw customError.forbidden(
        'You cannot remove the workspace owner from the workspace',
      );
    }

    // Only the owner can remove admins
    const isRequesterOwner =
      workspace.ownerId === user.id || workspace.createdBy === user.id;
    if (!isRequesterOwner && targetMember.role === 'admin') {
      throw customError.forbidden(
        'You do not have the permission to remove admins from the workspace',
      );
    }

  
    await this.memberService.removeMemberFromWorkspace(
      workspace.id,
      targetUserId,
    );

    this.logger.log(
      `User ${targetUserId} removed from workspace ${workspace.id} by ${user.id}`,
    );

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Member removed from workspace successfully',
    };
  }
}
