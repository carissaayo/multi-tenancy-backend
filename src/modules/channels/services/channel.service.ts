import { Injectable, Logger } from '@nestjs/common';
import { Channel, ChannelEntity } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChannelDto } from '../dtos/channel.dto';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { MemberService } from 'src/modules/members/services/member.service';
import { PermissionsEnum } from 'src/core/security/interfaces/permission.interface';
import { ChannelLifecycleService } from './channel-lifecycle.service';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  constructor(
    private readonly memberService: MemberService,
    private readonly channelLifecycleService: ChannelLifecycleService,
  ) {}

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

  async createChannel(req: AuthenticatedRequest, dto: CreateChannelDto): Promise<{ channel: Channel; message: string }> {
    const user = req.user!;
    const workspace = req.workspace!;

    const canManageChannels = await this.hasChannelManagementPermission(
      workspace.id,
      user.id,
      workspace,
    );
    if (!canManageChannels) {
      throw customError.forbidden('You do not have permission to create channels in this workspace');
    }

    const channel = await this.channelLifecycleService.createChannel(user, workspace, dto);
    return{
        channel: channel,
        message: 'Channel created successfully',
    }
  }
}
