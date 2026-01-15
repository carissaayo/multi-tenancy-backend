import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { ChannelQueryService } from './channel-query.service';

import { TokenManager } from 'src/core/security/services/token-manager.service';

import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class ChannelMembershipService {
  private readonly logger = new Logger(ChannelMembershipService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly workspacesService: WorkspacesService,
    private readonly memberService: MemberService,
    private readonly channelQueryService: ChannelQueryService,
    private readonly tokenManager: TokenManager,
  ) {}

  async isUserMember(
    channelId: string,
    memberId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Sanitize slug and get schema name
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const result = await this.dataSource.query(
        `SELECT 1 FROM "${schemaName}".channel_members WHERE channel_id = $1 AND member_id = $2`,
        [channelId, memberId],
      );
      return result.length > 0;
    } catch (error) {
      this.logger.error(
        `Error checking channel membership in schema ${schemaName}: ${error.message}`,
      );
      return false;
    }
  }

  async getChannel(req: AuthenticatedRequest, id: string) {
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
    const isAMember = await this.isUserMember(id, member.id, workspace.id);

    if (!isAMember) {
      throw customError.forbidden('You are not a member of this channel');
    }

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      channel: channel,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Channel retrieved successfully',
    };
  }

  async getAllChannelsInAWorkspace(req: AuthenticatedRequest) {
    const user = req.user!;
    const workspace = req.workspace!;

    const member = await this.memberService.isUserMember(workspace.id, user.id);
    if (!member) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    const channels = await this.channelQueryService.findAllChannelsInAWorkspace(
      workspace.id,
      member.id,
    );
    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      channels: channels,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Channels retrieved successfully',
    };
  }

  async joinChannel(req: AuthenticatedRequest, id: string, memberId: string) {
    const user = req.user!;
    const workspace = req.workspace!;



    // Check if member is already in the channel
    const isThisUserThisChannelMember = await this.isUserMember(
      id,
      memberId,
      workspace.id,
    );

    if (isThisUserThisChannelMember) {
      throw customError.badRequest('You are already a member of this channel');
    }

    // Add member to channel
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      await this.dataSource.query(
        `
        INSERT INTO "${schemaName}".channel_members
          (channel_id, member_id, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (channel_id, member_id) DO NOTHING
        `,
        [id, memberId],
      );

      this.logger.log(
        `Member ${memberId} joined channel ${id} in workspace ${workspace.id}`,
      );

     return true
    } catch (error) {
      this.logger.error(
        `Error adding member ${memberId} to channel ${id}: ${error.message}`,
      );

      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      throw customError.internalServerError('Failed to join channel');
    }
  }
}
