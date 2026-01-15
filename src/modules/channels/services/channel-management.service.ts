import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';

import { TokenManager } from 'src/core/security/services/token-manager.service';

import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelService } from './channel.service';

@Injectable()
export class ChannelManagementService {
  private readonly logger = new Logger(ChannelManagementService.name);

  constructor(
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
        'You need to be invited to join this private channel',
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
      channel: joinedChannel,
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
    targetMemberId: string,
  ) {
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

    const targetMember = await this.memberService.isUserMember(
      workspace.id,
      targetMemberId,
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
}
