import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { MemberService } from 'src/modules/members/services/member.service';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelService } from './channel.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';
import { ChannelInviteDto } from '../dtos/channel-invite.dto';
import { ChannelInvitation } from '../entities/channel_invitations.entity';
import { WorkspaceInvitationStatus } from 'src/modules/workspaces/interfaces/workspace.interface';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { EmailService } from 'src/core/email/services/email.service';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class ChannelInviteService {
  private readonly logger = new Logger(ChannelInviteService.name);
  private readonly INVITE_EXPIRY_DAYS = 1;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(ChannelInvitation)
    private readonly channelInvitationRepo: Repository<ChannelInvitation>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly memberService: MemberService,
    private readonly channelQueryService: ChannelQueryService,
    private readonly tokenManager: TokenManager,
    private readonly channelMembershipService: ChannelMembershipService,
    private readonly channelService: ChannelService,
    private readonly workspaceService: WorkspacesService,
    private readonly emailService: EmailService,
  ) {}

  async inviteToJoinPrivateChannel(
    req: AuthenticatedRequest,
    id: string,
    channelInviteDto: ChannelInviteDto,
  ) {
    const { memberId } = channelInviteDto;
    const user = req.user!;
    const workspace = req.workspace!;

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );
    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    if (!channel.isPrivate) {
      throw customError.badRequest(
        'You can only invite members to private channels',
      );
    }

    const inviterMember = await this.memberService.isUserMember(
      workspace.id,
      user.id,
    );

    if (!inviterMember) {
      throw customError.forbidden(
        'You must be a workspace member to invite others',
      );
    }

    if (inviterMember.id === memberId) {
      throw customError.forbidden('You cannot invite yourself to this channel');
    }

    const isInviterChannelMember =
      await this.channelMembershipService.isUserMember(
        id,
        inviterMember.id,
        workspace.id,
      );
    if (!isInviterChannelMember) {
      throw customError.forbidden(
        'You must be a member of this channel to invite others',
      );
    }

    const hasPermission =
      await this.channelService.hasChannelManagementPermission(
        workspace.id,
        user.id,
        workspace,
      );

    if (!hasPermission && channel.createdBy !== user.id) {
      throw customError.forbidden(
        'You do not have permission to invite members to this channel',
      );
    }
    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    const [invitedMember] = await this.dataSource.query(
      `SELECT m.id, m.user_id, u.email 
       FROM "${schemaName}".members m
       INNER JOIN public.users u ON m.user_id = u.id
       WHERE m.id = $1 AND m.is_active = true 
       LIMIT 1`,
      [memberId],
    );

    if (!invitedMember) {
      throw customError.badRequest(
        'The user is not a member of this workspace',
      );
    }

    const isMemberChannelMember =
      await this.channelMembershipService.isUserMember(
        id,
        memberId,
        workspace.id,
      );

    if (isMemberChannelMember) {
      throw customError.badRequest(
        'The user is already a member of this channel',
      );
    }

    const existingInvitation = await this.channelInvitationRepo.findOne({
      where: {
        channelId: id,
        memberId: memberId,
        workspaceId: workspace.id,
        expiresAt: MoreThan(new Date()),
        status: WorkspaceInvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw customError.badRequest(
        'This member already has a pending invitation to this channel',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * this.INVITE_EXPIRY_DAYS,
    );

    const invitation = this.channelInvitationRepo.create({
      channelId: id,
      workspaceId: workspace.id,
      memberId: memberId,
      invitedBy: user.id,
      expiresAt,
      token,
      status: WorkspaceInvitationStatus.PENDING,
    });

    await this.channelInvitationRepo.save(invitation);
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:8000';
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    const inviterName = user.fullName || user.email;

    // await remove because render do not support email sending in free plan
     this.emailService.sendChannelInvitation(
      invitedMember.email,
      workspace.name,
      channel.name,
      inviterName,
      inviteLink,
      expiresAt.toISOString(),
    );
    this.logger.log(
      `Channel invitation sent: member ${memberId} to channel ${id} in workspace ${workspace.id}`,
    );

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      message: 'Invitation to join the channel sent successfully',
      invitationId: invitation.id,
      token: token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async acceptInvitation(token: string) {
    const invitation = await this.channelInvitationRepo.findOne({
      where: { token, status: WorkspaceInvitationStatus.PENDING },
    });

    if (!invitation) {
      throw customError.notFound('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = WorkspaceInvitationStatus.EXPIRED;
      await this.channelInvitationRepo.save(invitation);
      throw customError.badRequest('This invitation has expired');
    }
    
    const workspace = await this.workspaceRepo.findOne({
      where: { id: invitation.workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    // Get member from workspace schema to get user_id
    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    const [member] = await this.dataSource.query(
      `SELECT id, user_id FROM "${schemaName}".members WHERE id = $1 AND is_active = true LIMIT 1`,
      [invitation.memberId],
    );

    if (!member) {
      throw customError.notFound('Member not found in this workspace');
    }

    // Get user from member's user_id
    const user = await this.userRepo.findOne({
      where: { id: member.user_id },
    });

    if (!user) {
      throw customError.notFound('User not found');
    }
    
    const isChannelMember = await this.channelMembershipService.isUserMember(
      invitation.channelId,
      invitation.memberId,
      workspace.id,
    );

    if (isChannelMember) {
      throw customError.badRequest('You are already a member of this channel');
    }

    await this.channelInvitationRepo.delete({
      channelId: invitation.channelId,
      memberId: invitation.memberId,
      status: WorkspaceInvitationStatus.ACCEPTED,
    });

    
    invitation.status = WorkspaceInvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user.id;
    await this.channelInvitationRepo.save(invitation);
    
    const channel = await this.channelMembershipService.addMemberToChannel(
      invitation.channelId,
      invitation.memberId,
      workspace.id,
    );

    this.logger.log(
      `Channel invitation accepted: member ${invitation.memberId} joined channel ${invitation.channelId}`,
    );

    return {
      message: 'You have successfully joined the channel',
      channel: channel,
    };
  }

  async revokeInvitation(invitationId: string, req: AuthenticatedRequest) {
    const user = req.user!;
    const workspace = req.workspace!;

    const invitation = await this.channelInvitationRepo.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw customError.notFound('Invitation not found');
    }

    if (invitation.workspaceId !== workspace.id) {
      throw customError.forbidden('Invitation is not for this workspace');
    }

    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw customError.badRequest('Invitation can no longer be revoked');
    }

    if (invitation.expiresAt < new Date()) {
      throw customError.badRequest('Invitation has already expired');
    }

    if (invitation.invitedBy !== user.id) {
      throw customError.forbidden('You can only revoke invitations you sent');
    }

    invitation.revokedBy = user.id;
    invitation.revokedAt = new Date();
    invitation.status = WorkspaceInvitationStatus.REVOKED;
    await this.channelInvitationRepo.save(invitation);

    this.logger.log(`Channel invitation ${invitationId} revoked`);

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      message: 'Invitation revoked successfully',
      invitationId: invitation.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }
}
