import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';

@Injectable()
export class ChannelMembershipService {
  private readonly logger = new Logger(ChannelMembershipService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly workspacesService: WorkspacesService,
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
}
