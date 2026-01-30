import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelService } from './channel.service';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';
import { RemoveMemberFromChannelDto, AddMemberToChannelDto } from '../dtos/channel-management.dto';

@Injectable()
export class ChannelManagementService {
  private readonly logger = new Logger(ChannelManagementService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly workspacesService: WorkspacesService,
    private readonly memberService: MemberService,
    private readonly channelQueryService: ChannelQueryService,
    private readonly channelMembershipService: ChannelMembershipService,
    private readonly channelService: ChannelService,
    private readonly tokenManager: TokenManager,
  ) {}

  async joinChannel(req: AuthenticatedRequest, id: string) {
    const user = req.user!;
    const workspace = req.workspace!;

    const member = await this.memberService.isUserMember(workspace.id, user.id);

    if (!member) {
      throw customError.notFound(
        'You have to be a member of the workspace to join its channels',
      );
    }

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );

    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    if (channel.isPrivate) {
      throw customError.badRequest(
        'You cannot join private channels. Ask a channel member to add you.',
      );
    }

    const isThisChannelMember =
      await this.channelMembershipService.isUserMember(
        id,
        member.id,
        workspace.id,
      );

    if (isThisChannelMember) {
      throw customError.badRequest('You are already a member of this channel');
    }

    const joinedChannel = await this.channelMembershipService.joinChannel(
      req,
      id,
      member.id,
    );

    if (!joinedChannel) {
      throw customError.internalServerError('Failed to join channel,try again');
    }

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'You have successfully joined the channel',
      channel: channel,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async leaveChannel(req: AuthenticatedRequest, id: string) {
    const user = req.user!;
    const workspace = req.workspace!;

    const member = await this.memberService.isUserMember(workspace.id, user.id);

    if (!member) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );

    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    await this.channelMembershipService.leaveChannel(
      id,
      member.id,
      workspace.id,
    );

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'You have successfully left the channel',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async removeMemberFromChannel(
    req: AuthenticatedRequest,
    id: string,
    dto: RemoveMemberFromChannelDto,
  ) {
    const { targetMemberId } = dto;
    const user = req.user!;
    const workspace = req.workspace!;

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );

    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    const hasPermission =
      await this.channelService.hasChannelManagementPermission(
        workspace.id,
        user.id,
        workspace,
      );

    const isChannelCreator = channel.createdBy === user.id;

    if (!hasPermission && !isChannelCreator) {
      throw customError.forbidden(
        'You do not have permission to remove members from this channel',
      );
    }

    const requesterMember = await this.memberService.isUserMember(
      workspace.id,
      user.id,
    );

    if (!requesterMember) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    if (requesterMember.id === targetMemberId) {
      throw customError.badRequest(
        'You cannot remove yourself. But you can leave the channel.',
      );
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    const [targetMember] = await this.dataSource.query(
      `SELECT id, user_id FROM "${schemaName}".members WHERE id = $1 AND is_active = true LIMIT 1`,
      [targetMemberId],
    );

    if (!targetMember) {
      throw customError.notFound('Target member not found in this workspace');
    }


    await this.channelMembershipService.removeMemberFromChannel(
      id,
      targetMemberId,
      workspace.id,
    );

    this.logger.log(
      `Member ${targetMemberId} removed from channel ${id} by user ${user.id}`,
    );

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'Member removed from channel successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async addToChannel(
    req: AuthenticatedRequest,
    id: string,
    dto: AddMemberToChannelDto,
  ) {
    const { memberId } = dto;
    const user = req.user!;
    const workspace = req.workspace!;

    // Check if requester is a workspace member
    const requesterMember = await this.memberService.isUserMember(
      workspace.id,
      user.id,
    );

    if (!requesterMember) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    // Get channel details
    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );

    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    // For private channels, check permissions
    if (channel.isPrivate) {
      // Check if requester is a member of the channel
      const isRequesterChannelMember =
        await this.channelMembershipService.isUserMember(
          id,
          requesterMember.id,
          workspace.id,
        );

      if (!isRequesterChannelMember) {
        throw customError.forbidden(
          'You must be a member of this channel to add others',
        );
      }

      // Check if requester has permission to manage channels
      const hasPermission =
        await this.channelService.hasChannelManagementPermission(
          workspace.id,
          user.id,
          workspace,
        );

      const isChannelCreator = channel.createdBy === user.id;

      if (!hasPermission && !isChannelCreator) {
        throw customError.forbidden(
          'You do not have permission to add members to this channel',
        );
      }
    }

    // Check if requester is trying to add themselves
    if (requesterMember.id === memberId) {
      throw customError.badRequest(
        'You cannot add yourself. Use the join endpoint instead.',
      );
    }

    // Get the schema name
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    // Verify the member to be added exists in the workspace
    const [targetMember] = await this.dataSource.query(
      `SELECT id, user_id FROM "${schemaName}".members WHERE id = $1 AND is_active = true LIMIT 1`,
      [memberId],
    );

    if (!targetMember) {
      throw customError.badRequest(
        'The user is not a member of this workspace',
      );
    }

    // Check if member is already in the channel
    const isMemberAlreadyInChannel =
      await this.channelMembershipService.isUserMember(
        id,
        memberId,
        workspace.id,
      );

    if (isMemberAlreadyInChannel) {
      throw customError.badRequest(
        'The user is already a member of this channel',
      );
    }

    // Add member to channel
    try {
      await this.dataSource.query(
        `
        INSERT INTO "${schemaName}".channel_members
          (channel_id, member_id, joined_at)
        VALUES ($1, $2, NOW())
        `,
        [id, memberId],
      );

      this.logger.log(
        `Member ${memberId} added to channel ${id} by user ${user.id}`,
      );

      const tokens = await this.tokenManager.signTokens(user, req);

      return {
        message: `Member added to ${channel.isPrivate ? 'private' : 'public'} channel successfully`,
        channelId: id,
        memberId: memberId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
      };
    } catch (error) {
      this.logger.error(
        `Error adding member ${memberId} to channel ${id}: ${error.message}`,
      );

      if (error.statusCode) {
        throw error;
      }

      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      throw customError.internalServerError('Failed to add member to channel');
    }
  }
  
}
