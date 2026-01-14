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
}
