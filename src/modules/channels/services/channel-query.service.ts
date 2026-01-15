import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { Channel } from '../entities/channel.entity';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class ChannelQueryService {
  private readonly logger = new Logger(ChannelQueryService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Find a channel by ID in a workspace
   * @param channelId - The channel ID
   * @param workspaceId - The workspace ID
   * @returns The channel if found, null otherwise
   */
  async findChannelById(
    channelId: string,
    workspaceId: string,
  ): Promise<Channel | null> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const result = await this.dataSource.query(
        `
        SELECT id, name, description, is_private, created_by, created_at, updated_at
        FROM "${schemaName}".channels
        WHERE id = $1
        LIMIT 1
        `,
        [channelId],
      );

      if (!result || result.length === 0) {
        return null;
      }

      const channelData = result[0];

      // Map SQL result to Channel format (snake_case -> camelCase)
      const channel: Channel = {
        id: channelData.id,
        name: channelData.name,
        description: channelData.description,
        isPrivate: channelData.is_private,
        createdBy: channelData.created_by,
        createdAt: channelData.created_at,
        updatedAt: channelData.updated_at,
      };

      return channel;
    } catch (error) {
      this.logger.error(
        `Error finding channel ${channelId} in workspace ${workspaceId}: ${error.message}`,
      );

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to find channel');
    }
  }

  /**
   * Find all channels in a workspace that the user can access
   * Returns all public channels + private channels the user is a member of
   * @param workspaceId - The workspace ID
   * @param memberId - The member ID (optional, for filtering private channels)
   * @returns The channels array (empty array if none found)
   */
  async findAllChannelsInAWorkspace(
    workspaceId: string,
    memberId?: string,
  ): Promise<Channel[]> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      let query = `
        SELECT DISTINCT c.id, c.name, c.description, c.is_private, c.created_by, c.created_at, c.updated_at
        FROM "${schemaName}".channels c
        WHERE c.is_private = false
      `;

      const params: any[] = [];

      // If memberId is provided, also include private channels the user is a member of
      if (memberId) {
        query += `
          OR (c.is_private = true AND EXISTS (
            SELECT 1 FROM "${schemaName}".channel_members cm
            WHERE cm.channel_id = c.id AND cm.member_id = $1
          ))
        `;
        params.push(memberId);
      }

      query += ` ORDER BY c.created_at ASC`;

      const result = await this.dataSource.query(query, params);

      if (!result || result.length === 0) {
        return [];
      }

      const channels: Channel[] = result.map((channel) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.is_private,
        createdBy: channel.created_by,
        createdAt: channel.created_at,
        updatedAt: channel.updated_at,
      }));

      return channels;
    } catch (error) {
      this.logger.error(
        `Error finding all channels in workspace ${workspaceId}: ${error.message}`,
      );

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to find channels');
    }
  }

  async findChannelMembers(channelId: string, workspaceId: string) {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      // Join channel_members with members and users to get complete member information
      const result = await this.dataSource.query(
        `
        SELECT 
          cm.id as channel_member_id,
          cm.joined_at as channel_joined_at,
          m.id as member_id,
          m.user_id,
          m.role,
          m.permissions,
          m.is_active as member_is_active,
          m.joined_at as workspace_joined_at,
          u.id as user_id,
          u.email,
          u.full_name,
          u.avatar_url,
          u.is_email_verified
        FROM "${schemaName}".channel_members cm
        INNER JOIN "${schemaName}".members m ON cm.member_id = m.id
        INNER JOIN public.users u ON m.user_id = u.id
        WHERE cm.channel_id = $1 AND m.is_active = true
        ORDER BY cm.joined_at ASC
        `,
        [channelId],
      );

      if (!result || result.length === 0) {
        return [];
      }

      // Map the results to a structured format
      return result.map((row) => ({
        channelMember: {
          id: row.channel_member_id,
          channelId: channelId,
          memberId: row.member_id,
          joinedAt: row.channel_joined_at,
        },
        member: {
          id: row.member_id,
          userId: row.user_id,
          role: row.role,
          isActive: row.member_is_active,
          joinedAt: row.workspace_joined_at,
        },
        user: {
          id: row.user_id,
          email: row.email,
          fullName: row.full_name,
          avatarUrl: row.avatar_url,
          isEmailVerified: row.is_email_verified,
        },
      }));
    } catch (error) {
      this.logger.error(
        `Error finding channel members for channel ${channelId} in workspace ${workspaceId}: ${error.message}`,
      );

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      // Re-throw custom errors
      if (error.statusCode) {
        throw error;
      }

      throw customError.internalServerError('Failed to find channel members');
    }
  }
}
