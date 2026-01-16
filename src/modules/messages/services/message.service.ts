import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkspacesService } from '../../workspaces/services/workspace.service';
import { MemberService } from '../../members/services/member.service';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
  ) {}

  /**
   * Create a new message in a channel
   */
  async createMessage(
    workspaceId: string,
    channelId: string,
    userId: string,
    content: string,
    threadId?: string,
  ): Promise<Message> {
    // Get workspace to access slug
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get memberId from userId
    const member = await this.memberService.isUserMember(workspaceId, userId);
    if (!member) {
      throw new Error('User is not a member of this workspace');
    }

    // Get sanitized slug for schema name
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    // Set search path to workspace schema
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // Insert message
      const [result] = await this.dataSource.query(
        `INSERT INTO "${schemaName}".messages 
         (channel_id, member_id, content, thread_id, type, is_edited, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [channelId, member.id, content, threadId || null, 'text', false],
      );

      // Map database result to Message interface
      const message: Message = {
        id: result.id,
        channelId: result.channel_id,
        memberId: result.member_id,
        content: result.content,
        type: result.type || 'text',
        threadId: result.thread_id,
        isEdited: result.is_edited,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        deletedAt: result.deleted_at,
      };

      return message;
    } catch (error) {
      this.logger.error('Error creating message:', error);
      throw error;
    } finally {
      // Reset search path
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Get messages for a channel
   */
  async getChannelMessages(
    workspaceId: string,
    channelId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      const results = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".messages 
         WHERE channel_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [channelId, limit, offset],
      );

      return results.map((result: any) => ({
        id: result.id,
        channelId: result.channel_id,
        memberId: result.member_id,
        content: result.content,
        type: result.type || 'text',
        threadId: result.thread_id,
        isEdited: result.is_edited,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        deletedAt: result.deleted_at,
      }));
    } catch (error) {
      this.logger.error('Error fetching messages:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }
}
