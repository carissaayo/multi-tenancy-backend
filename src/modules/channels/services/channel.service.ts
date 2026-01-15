import { Injectable, Logger } from '@nestjs/common';

import { ChannelLifecycleService } from './channel-lifecycle.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelQueryService } from './channel-query.service';
import { MemberService } from 'src/modules/members/services/member.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';

import { Channel } from '../entities/channel.entity';
import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { PermissionsEnum } from 'src/core/security/interfaces/permission.interface';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  constructor(
    private readonly memberService: MemberService,
    private readonly channelLifecycleService: ChannelLifecycleService,
    private readonly channelMembershipService: ChannelMembershipService,
    private readonly channelQueryService: ChannelQueryService,
    private readonly tokenManager: TokenManager,
  ) {}

  async createChannel(
    req: AuthenticatedRequest,
    dto: CreateChannelDto,
  ): Promise<{
    channel: Channel;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const user = req.user!;
    const workspace = req.workspace!;

    const canManageChannels = await this.hasChannelManagementPermission(
      workspace.id,
      user.id,
      workspace,
    );
    if (!canManageChannels) {
      throw customError.forbidden(
        'You do not have permission to create channels in this workspace',
      );
    }

    const channel = await this.channelLifecycleService.createChannel(
      user,
      workspace,
      dto,
    );

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'Channel created successfully',
      channel: channel,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async updateChannel(
    req: AuthenticatedRequest,
    id: string,
    updateDto: UpdateChannelDto,
  ) {
    const user = req.user!;
    const workspace = req.workspace!;

    const canManageChannels = await this.hasChannelManagementPermission(
      workspace.id,
      user.id,
      workspace,
    );
    if (!canManageChannels) {
      throw customError.forbidden(
        'You do not have permission to create channels in this workspace',
      );
    }

    const updatedChannel = await this.channelLifecycleService.updateChannel(
      req,
      id,
      updateDto,
    );

    console.log(updatedChannel);

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'Channel updated successfully',
      channel: updatedChannel,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async getChannel(req: AuthenticatedRequest, id: string) {
    return this.channelMembershipService.getChannel(req, id);
  }

  async getAllChannelsInAWorkspace(req: AuthenticatedRequest) {
    return this.channelMembershipService.getAllChannelsInAWorkspace(req);
  }

  async deleteChannel(
    req: AuthenticatedRequest,
    id: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const user = req.user!;
    const workspace = req.workspace!;

    const canManageChannels = await this.hasChannelManagementPermission(
      workspace.id,
      user.id,
      workspace,
    );
    if (!canManageChannels) {
      throw customError.forbidden(
        'You do not have permission to delete channels in this workspace',
      );
    }
    await this.channelLifecycleService.deleteChannel(req, id);

    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      message: 'Channel deleted successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }
  /**
   * Check if user has permission to manage channels
   * User must be either:
   * 1. The workspace owner, OR
   * 2. A member with channel management permissions
   */
  async hasChannelManagementPermission(
    workspaceId: string,
    userId: string,
    workspace: { ownerId: string; createdBy: string },
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
        `User ${userId} is not an active member of workspace ${workspaceId}`,
      );
      return false;
    }

    // Channel management permissions
    const channelManagementPermissions = [
      PermissionsEnum.CHANNEL_CREATE,
      PermissionsEnum.CHANNEL_UPDATE,
      PermissionsEnum.CHANNEL_DELETE,
      PermissionsEnum.CHANNEL_ARCHIVE,
      PermissionsEnum.CHANNEL_MANAGE_MEMBERS,
    ];

    // Check if user has any channel management permission
    const hasPermission = channelManagementPermissions.some((permission) =>
      member.permissions?.includes(permission.toString()),
    );

    // Also check if user is owner or admin (they should have channel management permissions)
    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';

    const canManageChannels = hasPermission || isOwnerOrAdmin;

    if (!canManageChannels) {
      this.logger.warn(
        `User ${userId} does not have channel management permission in workspace ${workspaceId}`,
      );
    }

    return canManageChannels;
  }


  async getChannelMembers(req: AuthenticatedRequest, id: string) {
    return this.channelMembershipService.getChannelMembers(req, id);
  }
}
