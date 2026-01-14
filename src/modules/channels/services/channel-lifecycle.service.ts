import { Injectable, Logger } from '@nestjs/common';
import { Channel, } from '../entities/channel.entity';
import { DataSource } from 'typeorm';

import { CreateChannelDto } from '../dtos/channel.dto';

import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { MemberService } from 'src/modules/members/services/member.service';

import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';

@Injectable()
export class ChannelLifecycleService {
  private readonly logger = new Logger(ChannelLifecycleService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
    private readonly workspaceService: WorkspacesService,
  ) {}

  async createChannel(
    user: User,
    workspace: Workspace,
    dto: CreateChannelDto,
  ): Promise<Channel> {
    
    // Get the member record for the user to get member ID
    const member = await this.memberService.isUserMember(workspace.id, user.id);
    if (!member) {
      throw customError.notFound('You are not a member of this workspace');
    }

    // Sanitize slug and get schema name
    const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      // Create channel in workspace-specific schema
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

      // Add creator as channel member
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

      // Handle unique constraint violation (channel name already exists)
      if (error.code === '23505') {
        throw customError.badRequest(
          'A channel with this name already exists in this workspace',
        );
      }

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to create channel');
    }
  }

  
}
