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

@Injectable()
export class ChannelManagementService {
  private readonly logger = new Logger(ChannelManagementService.name);

  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly memberService: MemberService,
    private readonly channelQueryService: ChannelQueryService,
    private readonly channelMembershipService: ChannelMembershipService,

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
      throw customError.badRequest('You need to be invited to join this private channel');
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

    const joinedChannel = await this.channelMembershipService.joinChannel(req, id, member.id);

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
}
