import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';


import { MemberService } from 'src/modules/members/services/member.service';

import { EmailService } from 'src/core/email/services/email.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { MessagingGateway } from 'src/modules/messages/gateways/messaging.gateway';
import { WorkspacesService } from './workspace.service';
import { ChannelMembershipService } from 'src/modules/channels/services/channel-membership.service';

import { WorkspaceInvitation } from '../entities/workspace_initations.entity';

import { PermissionsEnum } from 'src/core/security/interfaces/permission.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';


import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import { customError } from 'src/core/error-handler/custom-errors';

import {
  NoDataWorkspaceResponse,
  WorkspaceInvitationRole,
  WorkspaceInvitationStatus,
} from '../interfaces/workspace.interface';

@Injectable()
export class WorkspaceInviteService {
  private readonly logger = new Logger(WorkspaceInviteService.name);
  private readonly INIVTE_EXPIRY_DAYS = 1;
  constructor(
    @InjectRepository(WorkspaceInvitation)
    private readonly workspaceInvitationRepo: Repository<WorkspaceInvitation>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly tokenManager: TokenManager,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspaceService: WorkspacesService,
    @Inject(forwardRef(() => ChannelMembershipService))
    private readonly channelMembershipService: ChannelMembershipService,
  ) {}
  async inviteByEmail(
    req: AuthenticatedRequest,
    inviteDto: WorkspaceInviteDto,
  ) {
    const { email, role } = inviteDto;
    const user = req.user!;

    const workspace = req.workspace!;

    if (email === user.email) {
      throw customError.badRequest('You cannot invite yourself');
    }
    const isInviterAMember = await this.memberService.isUserMember(
      workspace.id,
      user.id,
    );
    if (!isInviterAMember) {
      throw customError.forbidden(
        'You must be a member of this workspace to send invitations',
      );
    }
    const canInvite = await this.hasInvitePermission(
      workspace.id,
      req.userId,
      workspace,
    );

    if (!canInvite) {
      throw customError.forbidden(
        'You do not have permission to invite members to this workspace. Only admins and owners can invite members.',
      );
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (!existingUser) {
      throw customError.badRequest('No user found with this email');
    }

    // Check if already a member
    const existingMember = await this.memberService.isUserMember(
      workspace.id,
      existingUser.id,
    );
    if (existingMember) {
      throw customError.badRequest(
        'This user is already a member of this workspace',
      );
    }
    const existingInvitation = await this.workspaceInvitationRepo.findOne({
      where: {
        workspaceId: workspace.id,
        email,
        status: WorkspaceInvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      if (existingInvitation.expiresAt > new Date()) {
        throw customError.badRequest(
          'This email is already invited to this workspace',
        );
      }
      existingInvitation.status = WorkspaceInvitationStatus.EXPIRED;
      await this.workspaceInvitationRepo.save(existingInvitation);
      this.logger.log(
        `Expired invitation for ${email} in workspace ${workspace.id} marked as EXPIRED`,
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * this.INIVTE_EXPIRY_DAYS,
    );
    const invitation = this.workspaceInvitationRepo.create({
      workspaceId: workspace.id,
      email,
      invitedBy: req.userId,
      expiresAt,
      token,
      role: role ?? WorkspaceInvitationRole.MEMBER,
      sentToId: existingUser.id,
      sentTo: existingUser,
    });
    await this.workspaceInvitationRepo.save(invitation);

    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:8000';
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    const inviterName = user.fullName || user.email;

    // await remove because render do not support email sending in free plan
    this.emailService.sendWorkspaceInvitation(
      email,
      workspace.name,
      inviterName,
      inviteLink,
      expiresAt.toISOString(),
    );

    this.logger.log(
      `Invitation sent to ${email} for workspace ${workspace.name}`,
    );

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
      token: token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async acceptInvitation(token: string) {
    const invitation = await this.workspaceInvitationRepo.findOne({
      where: { token, status: WorkspaceInvitationStatus.PENDING },
      relations: ['workspace'],
    });

    if (!invitation) {
      throw customError.notFound('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = WorkspaceInvitationStatus.EXPIRED;
      await this.workspaceInvitationRepo.save(invitation);
      throw customError.badRequest('This invitation has expired');
    }

    const user = await this.userRepo.findOne({
      where: { id: invitation.sentToId as string },
    });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Check if user's email matches invitation email
    if (user.email !== invitation.email) {
      throw customError.forbidden(
        'This invitation was sent to a different email address',
      );
    }

    // Check if already a member
    const existingMember = await this.memberService.isUserMember(
      invitation.workspaceId,
      user.id,
    );
    if (existingMember) {
      throw customError.badRequest(
        'This user is already a member of this workspace',
      );
    }

    
    // Delete any existing ACCEPTED invitations for this workspace+email
    await this.workspaceInvitationRepo.delete({
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      status: WorkspaceInvitationStatus.ACCEPTED,
    });

    invitation.status = WorkspaceInvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user.id;
    await this.workspaceInvitationRepo.save(invitation);

    const workspace = invitation.workspace;
    const inviterId = invitation.invitedBy;
    if (!inviterId) {
      throw customError.badRequest('InviterId not found');
    }
    const inviter = await this.userRepo.findOne({
      where: { id: inviterId as string },
    });

    if (!inviter) {
      throw customError.notFound('Inviter not found');
    }

    const newMember = await this.memberService.addMemberToWorkspace(
      workspace.id,
      user.id,
      invitation.role ?? WorkspaceInvitationRole.MEMBER,
    );


    // Add member to default channels (general and random)
    await this.addMemberToDefaultChannels(workspace.id, newMember.id);


    // Emit WebSocket events

    // Automatically join user to workspace WebSocket room if they have active connections
  await this.messagingGateway.joinUserToWorkspace(user.id, workspace.id);

 
    // 1. Notify the user who accepted that they've joined
    this.messagingGateway.emitToUser(user.id, 'workspaceJoined', {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      message: 'You have successfully joined the workspace',
    });

    // 2. Notify all workspace members that a new member joined
    this.messagingGateway.emitToWorkspace(workspace.id, 'memberJoined', {
      workspaceId: workspace.id,
      member: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      role: invitation.role ?? WorkspaceInvitationRole.MEMBER,
      joinedAt: new Date(),
    });

    this.logger.log(
      `User ${user.id} accepted invitation and joined workspace ${workspace.id}`,
    );

    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:8000';
    const workspaceUrl = `${frontendUrl}/workspace/${workspace.id}`;

    await this.emailService.sendWelcomeToWorkspace(
      user.email,
      user.fullName || user.email,
      workspace.name,
      workspaceUrl,
      inviter ? `${inviter.fullName}` : undefined,
    );

    return {
      message: 'You have successfully joined the workspace',
      workspace,
    };
  }

  async revokeInvite(
    inviteId: string,
    req: AuthenticatedRequest,
  ): Promise<NoDataWorkspaceResponse> {
    const user = req.user!;

    const invitation = await this.workspaceInvitationRepo.findOne({
      where: { id: inviteId },
    });
    if (!invitation) {
      throw customError.notFound('Invitation not found');
    }
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw customError.badRequest('Invitation can no longer be revoked');
    }
    if (invitation.expiresAt < new Date()) {
      throw customError.badRequest('Invitation has already expired');
    }
    if (invitation.workspaceId !== req.workspaceId) {
      throw customError.badRequest('Invitation is not for this workspace');
    }
    if (invitation.invitedBy !== user.id) {
      throw customError.badRequest('You can only revoke invitations you sent');
    }

    invitation.revokedBy = user.id;
    invitation.revokedByUser = user;
    invitation.revokedAt = new Date();
    invitation.status = WorkspaceInvitationStatus.REVOKED;
    await this.workspaceInvitationRepo.save(invitation);

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'Invitation revoked successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }
  /**
 * Add new member to default channels (general and random)
 */
  private async addMemberToDefaultChannels(
    workspaceId: string,
    memberId: string,
  ): Promise<void> {
    try {
      const workspace = await this.workspaceService.findById(workspaceId);
      if (!workspace) {
        this.logger.warn(
          `Workspace ${workspaceId} not found, skipping default channel join`,
        );
        return;
      }

      const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
        workspace.slug,
      );
      const schemaName = `workspace_${sanitizedSlug}`;

      // Find default channels (general and random)
      const defaultChannels = await this.dataSource.query(
        `
        SELECT id, name 
        FROM "${schemaName}".channels 
        WHERE name IN ('general', 'random') 
        AND is_private = false
        ORDER BY name
      `,
      );

      if (!defaultChannels || defaultChannels.length === 0) {
        this.logger.warn(
          `No default channels found in workspace ${workspaceId}, skipping`,
        );
        return;
      }

      // Add member to each default channel
      for (const channel of defaultChannels) {
        try {
          await this.channelMembershipService.addMemberToChannel(
            channel.id,
            memberId,
            workspaceId,
          );
          this.logger.log(
            `Added member ${memberId} to default channel ${channel.name} (${channel.id}) in workspace ${workspaceId}`,
          );
        } catch (error: any) {
          // If member is already in channel, that's okay - just log it
          if (error.message?.includes('already')) {
            this.logger.debug(
              `Member ${memberId} already in channel ${channel.name}`,
            );
          } else {
            this.logger.error(
              `Failed to add member ${memberId} to channel ${channel.name}: ${error.message}`,
            );
          }
        }
      }
    } catch (error) {
      // Don't fail the invitation acceptance if channel joining fails
      this.logger.error(
        `Error adding member ${memberId} to default channels in workspace ${workspaceId}: ${error.message}`,
      );
    }
  }

  /**
   * Get all invitations for a workspace
   * @param req - Authenticated request
   * @returns List of workspace invitations with inviter and invitee details
   */
  async listWorkspaceInvites(req: AuthenticatedRequest) {
    const workspace = req.workspace!;
    const userId = req.userId;

    // Check if user has permission to view invitations (must be admin or owner)
    const canView = await this.hasInvitePermission(
      workspace.id,
      userId,
      workspace,
    );

    if (!canView) {
      throw customError.forbidden(
        'You do not have permission to view workspace invitations',
      );
    }

    // Get all invitations for this workspace
    const invitations = await this.workspaceInvitationRepo.find({
      where: { workspaceId: workspace.id },
      relations: ['sentTo', 'inviter', 'revokedByUser'],
      order: { invitedAt: 'DESC' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        invitedAt: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        invitedBy: true,
        sentToId: true,
        revokedBy: true,
        sentTo: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
        inviter: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
        revokedByUser: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    });

    const tokens = await this.tokenManager.signTokens(req.user!, req);

    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invitedAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        revokedAt: inv.revokedAt,
        invitedBy: inv.inviter
          ? {
              id: inv.inviter.id,
              email: inv.inviter.email,
              fullName: inv.inviter.fullName,
              avatarUrl: inv.inviter.avatarUrl,
            }
          : null,
        sentTo: inv.sentTo
          ? {
              id: inv.sentTo.id,
              email: inv.sentTo.email,
              fullName: inv.sentTo.fullName,
              avatarUrl: inv.sentTo.avatarUrl,
            }
          : null,
        revokedBy: inv.revokedByUser
          ? {
              id: inv.revokedByUser.id,
              email: inv.revokedByUser.email,
              fullName: inv.revokedByUser.fullName,
              avatarUrl: inv.revokedByUser.avatarUrl,
            }
          : null,
      })),
      total: invitations.length,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace invitations retrieved successfully',
    };
  }

  /**
   * Get all pending invitations for the current user
   * This allows users to see and accept invitations without email
   * (useful when email sending is not available, e.g., Render free tier)
   */
  async getMyInvitations(req: AuthenticatedRequest) {
    const userId = req.userId;
    const user = req.user!;

    // Get all pending invitations sent to this user
    const invitations = await this.workspaceInvitationRepo.find({
      where: {
        sentToId: userId,
        status: WorkspaceInvitationStatus.PENDING,
      },
      relations: ['workspace', 'inviter'],
      order: { invitedAt: 'DESC' },
    });

    // Filter out expired invitations and mark them as expired
    const validInvitations: WorkspaceInvitation[] = [];
    for (const invitation of invitations) {
      if (invitation.expiresAt < new Date()) {
        invitation.status = WorkspaceInvitationStatus.EXPIRED;
        await this.workspaceInvitationRepo.save(invitation);
        this.logger.debug(`Marked invitation ${invitation.id} as expired`);
      } else {
        validInvitations.push(invitation);
      }
    }

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      invitations: validInvitations.map((inv) => ({
        id: inv.id,
        token: inv.token,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invitedAt,
        expiresAt: inv.expiresAt,
        workspace: inv.workspace
          ? {
              id: inv.workspace.id,
              name: inv.workspace.name,
              slug: inv.workspace.slug,
              logoUrl: inv.workspace.logoUrl,
            }
          : null,
        invitedBy: inv.inviter
          ? {
              id: inv.inviter.id,
              email: inv.inviter.email,
              fullName: inv.inviter.fullName,
              avatarUrl: inv.inviter.avatarUrl,
            }
          : null,
      })),
      total: validInvitations.length,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Your pending invitations retrieved successfully',
    };
  }

  /**
   * Check if user has permission to invite members
   * User must be either:
   * 1. The workspace owner, OR
   * 2. A member with MEMBER_INVITE permission (admin/owner role)
   */
  private async hasInvitePermission(
    workspaceId: string,
    userId: string,
    workspace: Workspace,
  ): Promise<boolean> {
    // Check if user is the workspace owner
    if (workspace.createdBy === userId || workspace.ownerId === userId) {
      this.logger.debug(
        `User ${userId} is the owner of workspace ${workspaceId}`,
      );
      return true;
    }

    // Check if user is a member of the workspace
    const member = await this.memberService.isUserMember(workspaceId, userId);

    if (!member || !member.isActive) {
      this.logger.warn(
        `User ${userId} is not a member of workspace ${workspaceId}`,
      );
      return false;
    }

    // Check if user has MEMBER_INVITE permission
    const hasPermission = member.permissions?.includes(
      PermissionsEnum.MEMBER_INVITE,
    );

    // Also check if user is owner or admin (they should have invite permission)
    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';

    const canInvite = hasPermission || isOwnerOrAdmin;

    if (!canInvite) {
      this.logger.warn(
        `User ${userId} does not have invite permission in workspace ${workspaceId}`,
      );
    }

    return canInvite;
  }
}
