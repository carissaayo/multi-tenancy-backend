import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MemberService } from 'src/modules/members/services/member.service';
import { ChannelQueryService } from './channel-query.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';

import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';

import { Channel } from '../entities/channel.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';

import { customError } from 'src/core/error-handler/custom-errors';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@Injectable()
export class ChannelLifecycleService {
  private readonly logger = new Logger(ChannelLifecycleService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
    private readonly workspaceService: WorkspacesService,
    private readonly channelQueryService: ChannelQueryService,
  ) {}

  async createChannel(
    user: User,
    workspace: Workspace,
    dto: CreateChannelDto,
  ): Promise<Channel> {
    const member = await this.memberService.isUserMember(workspace.id, user.id);
    if (!member) {
      throw customError.notFound('You are not a member of this workspace');
    }

    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const result = await this.dataSource.query(
        `
        INSERT INTO "${schemaName}".channels
          (name, description, is_private, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, description, is_private, created_by, created_at, updated_at
        `,
        [dto.name, dto.description || null, dto.isPrivate || false, user.id],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError('Failed to create channel');
      }

      const channelData = result[0];

      await this.dataSource.query(
        `
        INSERT INTO "${schemaName}".channel_members
          (channel_id, member_id, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (channel_id, member_id) DO NOTHING
        `,
        [channelData.id, member.id],
      );

      const channel: Channel = {
        id: channelData.id,
        name: channelData.name,
        description: channelData.description,
        isPrivate: channelData.is_private,
        createdBy: channelData.created_by,
        createdAt: channelData.created_at,
        updatedAt: channelData.updated_at,
      };

      this.logger.log(
        `Channel created: ${channel.name} (${channel.id}) in workspace ${workspace.id} by user ${user.id}`,
      );

      return channel;
    } catch (error) {
      this.logger.error(
        `Error creating channel in workspace ${workspace.id}: ${error.message}`,
      );

      if (error.code === '23505') {
        throw customError.badRequest(
          'A channel with this name already exists in this workspace',
        );
      }

      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to create channel');
    }
  }

  async updateChannel(
    req: AuthenticatedRequest,
    id: string,
    updateDto: UpdateChannelDto,
  ): Promise<Channel> {
    const user = req.user!;
    const workspace = req.workspace!;

    const member = await this.memberService.isUserMember(workspace.id, user.id);
    if (!member) {
      throw customError.notFound('You are not a member of this workspace');
    }

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );

    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(updateDto.name);
        paramIndex++;
      }

      if (updateDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(updateDto.description || null);
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) {
        throw customError.badRequest('No fields to update');
      }

      updateValues.push(id);

      const updateQuery = `
        UPDATE "${schemaName}".channels
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, description, is_private, created_by, created_at, updated_at
      `;

      const result = await this.dataSource.query(updateQuery, updateValues);

      if (!result || result.length === 0) {
        throw customError.internalServerError('Failed to update channel');
      }

      const rows = Array.isArray(result[0]) ? result[0] : result;
      const channelData = rows[0];

      if (!channelData) {
        throw customError.internalServerError('Failed to update channel');
      }

      const updatedChannel: Channel = {
        id: channelData.id,
        name: channelData.name,
        description: channelData.description,
        isPrivate: channelData.is_private,
        createdBy: channelData.created_by,
        createdAt: channelData.created_at,
        updatedAt: channelData.updated_at,
      };

      if (!updatedChannel.id || !updatedChannel.name) {
        this.logger.error(
          `Invalid channel data returned: ${JSON.stringify(channelData)}`,
        );
        throw customError.internalServerError(
          'Invalid channel data returned from update',
        );
      }

      this.logger.log(
        `Channel updated: ${updatedChannel.name} (${updatedChannel.id}) in workspace ${workspace.id} by user ${user.id}`,
      );

      return updatedChannel;
    } catch (error) {
      this.logger.error(
        `Error updating channel ${id} in workspace ${workspace.id}: ${error.message}`,
        error.stack,
      );

      if (error.code === '23505') {
        throw customError.badRequest(
          'A channel with this name already exists in this workspace',
        );
      }

      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to update channel');
    }
  }

  async deleteChannel(req: AuthenticatedRequest, id: string): Promise<void> {
    const user = req.user!;
    const workspace = req.workspace!;

    const member = await this.memberService.isUserMember(workspace.id, user.id);
    if (!member) {
      throw customError.notFound('You are not a member of this workspace');
    }

    const channel = await this.channelQueryService.findChannelById(
      id,
      workspace.id,
    );
    if (!channel) {
      throw customError.notFound('Channel not found');
    }

    const defaultChannelNames = ['general', 'random'];
    const channelNameLower = (channel.name || '').trim().toLowerCase();
    if (defaultChannelNames.includes(channelNameLower)) {
      throw customError.forbidden(
        'The general and random channels cannot be deleted',
      );
    }

    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const result = await this.dataSource.query(
        `
        DELETE FROM "${schemaName}".channels
        WHERE id = $1
        RETURNING id, name
        `,
        [id],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError('Failed to delete channel');
      }

      const rows = Array.isArray(result[0]) ? result[0] : result;
      const deletedChannel = rows[0];

      if (!deletedChannel) {
        throw customError.internalServerError('Failed to delete channel');
      }

      this.logger.log(
        `Channel deleted: ${deletedChannel.name} (${deletedChannel.id}) in workspace ${workspace.id} by user ${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting channel ${id} in workspace ${workspace.id}: ${error.message}`,
        error.stack,
      );

      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to delete channel');
    }
  }
}
