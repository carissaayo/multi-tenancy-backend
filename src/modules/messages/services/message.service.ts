import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkspacesService } from '../../workspaces/services/workspace.service';
import { MemberService } from '../../members/services/member.service';
import { Message } from '../entities/message.entity';
import { ChannelMembershipService } from 'src/modules/channels/services/channel-membership.service';
import { customError } from 'src/core/error-handler/custom-errors';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';


@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    @Inject(forwardRef(() => ChannelMembershipService))
    private readonly channelMembershipService: ChannelMembershipService,
  ) { }

  /**
   * Helper method to validate workspace membership and return workspace and member
   * @throws customError.notFound if workspace not found
   * @throws customError.forbidden if user is not a member
   */
  private async validateWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<{
    workspace: Awaited<ReturnType<typeof this.workspacesService.findById>>;
    member: Awaited<ReturnType<typeof this.memberService.isUserMember>>;
    schemaName: string;
  }> {
    const workspace = await this.workspacesService.findById(workspaceId);
    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const member = await this.memberService.isUserMember(workspaceId, userId);
    if (!member) {
      throw customError.forbidden('You are not a member of this workspace');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    return { workspace, member, schemaName };
  }

  /**
   * Helper method to validate channel membership
   * @throws customError.forbidden if user is not a member of the channel
   */
  private async validateChannelMembership(
    channelId: string,
    memberId: string,
    workspaceId: string,
  ): Promise<void> {
    const isChannelMember = await this.channelMembershipService.isUserMember(
      channelId,
      memberId,
      workspaceId,
    );
    if (!isChannelMember) {
      throw customError.forbidden('You are not a member of this channel');
    }
  }

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

    const { member, schemaName } = await this.validateWorkspaceMembership(
      workspaceId,
      userId,
    );
   
    await this.validateChannelMembership(channelId, member.id, workspaceId);

    // Set search path to workspace schema
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // Check if type column exists
      const columnCheck = await this.dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 
      AND table_name = 'messages' 
      AND column_name = 'type'
    `, [schemaName]);

      const hasTypeColumn = columnCheck.length > 0;

      // Insert message - conditionally include type column
      let query: string;
      let params: any[];

      if (hasTypeColumn) {
        query = `INSERT INTO "${schemaName}".messages 
               (channel_id, member_id, content, thread_id, type, is_edited, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
               RETURNING *`;
        params = [channelId, member.id, content, threadId || null, 'text', false];
      } else {
        query = `INSERT INTO "${schemaName}".messages 
               (channel_id, member_id, content, thread_id, is_edited, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
               RETURNING *`;
        params = [channelId, member.id, content, threadId || null, false];
      }

      const [result] = await this.dataSource.query(query, params);

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
        deletedAt: result.deleted_at || null,
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
    * Get messages for a channel with cursor-based pagination
    */
  async getChannelMessages(
    req: AuthenticatedRequest,
    channelId: string,
  ): Promise<{
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const userId = req.userId;
    const workspaceId = req.workspaceId!;

    const limit = Math.min(Number(req.query?.limit) || 50, 100);
    const cursor = req.query?.cursor as string;
    const direction = req.query?.direction as 'before' | 'after' || 'before';
    // Validate workspace membership and get schema name and member
    const { member, schemaName } = await this.validateWorkspaceMembership(
      workspaceId,
      userId,
    );

    // Validate channel membership
    await this.validateChannelMembership(channelId, member.id, workspaceId);

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      let query: string;
      let params: any[];

      if (cursor) {
        const [cursorMessage] = await this.dataSource.query(
          `SELECT created_at FROM "${schemaName}".messages 
         WHERE id = $1 AND channel_id = $2 AND deleted_at IS NULL`,
          [cursor, channelId],
        );

        if (!cursorMessage) {
          throw new Error('Invalid cursor: message not found');
        }

        const cursorTimestamp = cursorMessage.created_at;

        if (direction === 'before') {
          query = `SELECT * FROM "${schemaName}".messages 
                 WHERE channel_id = $1 
                 AND deleted_at IS NULL
                 AND created_at < $2
                 ORDER BY created_at DESC
                 LIMIT $3`;
          params = [channelId, cursorTimestamp, limit + 1];
        } else {
          query = `SELECT * FROM "${schemaName}".messages 
                 WHERE channel_id = $1 
                 AND deleted_at IS NULL
                 AND created_at > $2
                 ORDER BY created_at ASC
                 LIMIT $3`;
          params = [channelId, cursorTimestamp, limit + 1];
        }
      } else {
        query = `SELECT * FROM "${schemaName}".messages 
               WHERE channel_id = $1 
               AND deleted_at IS NULL
               ORDER BY created_at DESC
               LIMIT $2`;
        params = [channelId, limit + 1];
      }

      const results = await this.dataSource.query(query, params);

      const hasMore = results.length > limit;
      const messages = hasMore ? results.slice(0, limit) : results;

      let nextCursor: string | null = null;
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        nextCursor = lastMessage.id;
      }

      const orderedMessages = direction === 'after' ? messages.reverse() : messages;

      const mappedMessages = orderedMessages.map((result: any) => ({
        id: result.id,
        channelId: result.channel_id,
        memberId: result.member_id,
        content: result.content,
        type: result.type || 'text',
        threadId: result.thread_id,
        isEdited: result.is_edited,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        deletedAt: result.deleted_at || null,
      }));

      return {
        messages: mappedMessages,
        nextCursor: hasMore ? nextCursor : null,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error fetching messages:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Get a message by ID
   */
  async getMessageById(
    req: AuthenticatedRequest,
    messageId: string,
  ): Promise<Message | null> {
    const workspaceId = req.workspaceId!;
    const userId = req.userId;

    // Validate workspace membership first (before querying database)
    const { member, schemaName } = await this.validateWorkspaceMembership(
      workspaceId,
      userId,
    );

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      const [result] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [messageId],
      );

      if (!result) {
        return null;
      }

      // Validate channel membership after confirming message exists
      await this.validateChannelMembership(
        result.channel_id,
        member.id,
        workspaceId,
      );

      return {
        id: result.id,
        channelId: result.channel_id,
        memberId: result.member_id,
        content: result.content,
        type: result.type || 'text',
        threadId: result.thread_id,
        isEdited: result.is_edited,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        deletedAt: result.deleted_at || null,
      };
    } catch (error) {
      this.logger.error('Error fetching message:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Update a message by its sender
   */
  async updateMessageBySender(
    req: AuthenticatedRequest,
    messageId: string,
    newContent: string,
  ): Promise<Message> {
    const { member, schemaName } = await this.validateWorkspaceMembership(
      req.workspaceId!,
      req.userId,
    );

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // First, verify the message exists and belongs to this member
      const [existingMessage] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND member_id = $2 AND deleted_at IS NULL
         LIMIT 1`,
        [messageId, member.id],
      );

      if (!existingMessage) {
        throw customError.forbidden(
          'Message not found or you do not have permission to update it',
        );
      }

      // Validate channel membership
      await this.validateChannelMembership(
        existingMessage.channel_id,
        member.id,
        req.workspaceId!,
      );

      // Update the message
      const [result] = await this.dataSource.query(
        `UPDATE "${schemaName}".messages 
         SET content = $1, is_edited = true, updated_at = NOW()
         WHERE id = $2 AND member_id = $3
         RETURNING *`,
        [newContent, messageId, member.id],
      );

      if (!result) {
        throw customError.internalServerError('Failed to update message');
      }

      return {
        id: result.id,
        channelId: result.channel_id,
        memberId: result.member_id,
        content: result.content,
        type: result.type || 'text',
        threadId: result.thread_id,
        isEdited: result.is_edited,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        deletedAt: result.deleted_at || null,
      };
    } catch (error) {
      this.logger.error('Error updating message:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Delete a message by its sender (soft delete)
   */
  async deleteMessageBySender(
    req: AuthenticatedRequest,
    messageId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate workspace membership
    const { member, schemaName } = await this.validateWorkspaceMembership(
      req.workspaceId!,
      req.userId,
    );

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // First, verify the message exists and belongs to this member
      const [existingMessage] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND member_id = $2 AND deleted_at IS NULL
         LIMIT 1`,
        [messageId, member.id],
      );

      if (!existingMessage) {
        throw customError.forbidden(
          'Message not found or you do not have permission to delete it',
        );
      }

      // Validate channel membership
      await this.validateChannelMembership(
        existingMessage.channel_id,
        member.id,
        req.workspaceId!,
      );

      // Soft delete the message
      const [result] = await this.dataSource.query(
        `UPDATE "${schemaName}".messages 
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND member_id = $2
         RETURNING id`,
        [messageId, member.id],
      );

      if (!result) {
        throw customError.internalServerError('Failed to delete message');
      }

      this.logger.log(
        `Message ${messageId} soft deleted by sender ${req.userId} in workspace ${req.workspaceId!}`,
      );

      return {
        success: true,
        message: 'Message deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Delete a message by admin or owner (soft delete)
   */
  async deleteMessageByAdmin(
    req: AuthenticatedRequest,
    messageId: string,
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.userId;
    const workspaceId = req.workspaceId!;

    // Validate workspace membership
    const { workspace, member, schemaName } = await this.validateWorkspaceMembership(
      workspaceId,
      userId,
    );

    // Check if user is owner or admin
    const isOwner =
      workspace.ownerId === userId || workspace.createdBy === userId;
    const isAdmin = member.role === 'admin' || member.role === 'owner';

    if (!isOwner && !isAdmin) {
      throw customError.forbidden(
        'Only workspace owners and admins can delete messages',
      );
    }

    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // Verify the message exists
      const [existingMessage] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [messageId],
      );

      if (!existingMessage) {
        throw customError.notFound('Message not found or already deleted');
      }

      // Validate channel membership
      await this.validateChannelMembership(
        existingMessage.channel_id,
        member.id,
        workspaceId,
      );

      // Soft delete the message
      const [result] = await this.dataSource.query(
        `UPDATE "${schemaName}".messages 
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [messageId],
      );

      if (!result) {
        throw customError.internalServerError('Failed to delete message');
      }

      this.logger.log(
        `Message ${messageId} soft deleted by admin ${userId} in workspace ${workspaceId}`,
      );

      return {
        success: true,
        message: 'Message deleted successfully by admin',
      };
    } catch (error) {
      this.logger.error('Error deleting message by admin:', error);
      throw error;
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }
}