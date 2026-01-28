"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const member_service_1 = require("../../members/services/member.service");
const channel_membership_service_1 = require("../../channels/services/channel-membership.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const channel_query_service_1 = require("../../channels/services/channel-query.service");
let MessageService = MessageService_1 = class MessageService {
    dataSource;
    workspacesService;
    memberService;
    channelMembershipService;
    channelQueryService;
    logger = new common_1.Logger(MessageService_1.name);
    constructor(dataSource, workspacesService, memberService, channelMembershipService, channelQueryService) {
        this.dataSource = dataSource;
        this.workspacesService = workspacesService;
        this.memberService = memberService;
        this.channelMembershipService = channelMembershipService;
        this.channelQueryService = channelQueryService;
    }
    async validateWorkspaceMembership(workspaceId, userId) {
        const workspace = await this.workspacesService.findById(workspaceId);
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const member = await this.memberService.isUserMember(workspaceId, userId);
        if (!member) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        return { workspace, member, schemaName };
    }
    async validateChannelMembership(channelId, memberId, workspaceId, userId) {
        console.log(channelId, "channelId");
        const isChannelMember = await this.channelMembershipService.isUserMember(channelId, memberId, workspaceId);
        if (isChannelMember) {
            return;
        }
        const workspace = await this.workspacesService.findById(workspaceId);
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const channel = await this.channelQueryService.findChannelById(channelId, workspaceId);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        if (channel.isPrivate) {
            throw custom_errors_1.customError.forbidden('You are not a member of this private channel');
        }
        const isOwner = workspace.ownerId === userId || workspace.createdBy === userId;
        const member = await this.memberService.isUserMember(workspaceId, userId);
        const isAdmin = member?.role === 'admin' || member?.role === 'owner';
        if (isOwner || isAdmin) {
            this.logger.debug(`Allowing ${isOwner ? 'owner' : 'admin'} ${userId} access to public channel ${channel.name}`);
            return;
        }
        throw custom_errors_1.customError.forbidden('You are not a member of this channel');
    }
    async createMessage(workspaceId, channelId, userId, content, threadId) {
        const { member, schemaName } = await this.validateWorkspaceMembership(workspaceId, userId);
        await this.validateChannelMembership(channelId, member.id, workspaceId, userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const columnCheck = await this.dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 
      AND table_name = 'messages' 
      AND column_name = 'type'
    `, [schemaName]);
            const hasTypeColumn = columnCheck.length > 0;
            let query;
            let params;
            if (hasTypeColumn) {
                query = `INSERT INTO "${schemaName}".messages 
               (channel_id, member_id, content, thread_id, type, is_edited, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
               RETURNING *`;
                params = [channelId, member.id, content, threadId || null, 'text', false];
            }
            else {
                query = `INSERT INTO "${schemaName}".messages 
               (channel_id, member_id, content, thread_id, is_edited, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
               RETURNING *`;
                params = [channelId, member.id, content, threadId || null, false];
            }
            const [result] = await this.dataSource.query(query, params);
            const message = {
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
        }
        catch (error) {
            this.logger.error('Error creating message:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async getChannelMessages(req, channelId) {
        const userId = req.userId;
        const workspaceId = req.workspaceId;
        const limit = Math.min(Number(req.query?.limit) || 50, 100);
        const cursor = req.query?.cursor;
        const direction = req.query?.direction || 'before';
        const { member, schemaName } = await this.validateWorkspaceMembership(workspaceId, userId);
        await this.validateChannelMembership(channelId, member.id, workspaceId, userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            let query;
            let params;
            const selectClause = `
            SELECT 
                m.*,
                u.full_name as user_full_name,
                u.avatar_url as user_avatar_url,
                u.email as user_email,
                u.id as user_id
            FROM "${schemaName}".messages m
            INNER JOIN "${schemaName}".members mem ON m.member_id = mem.id
            INNER JOIN public.users u ON mem.user_id = u.id
        `;
            if (cursor) {
                const [cursorMessage] = await this.dataSource.query(`SELECT created_at FROM "${schemaName}".messages 
                 WHERE id = $1 AND channel_id = $2 AND deleted_at IS NULL`, [cursor, channelId]);
                if (!cursorMessage) {
                    throw new Error('Invalid cursor: message not found');
                }
                const cursorTimestamp = cursorMessage.created_at;
                if (direction === 'before') {
                    query = `${selectClause}
                    WHERE m.channel_id = $1 
                        AND m.deleted_at IS NULL
                        AND m.created_at < $2
                 ORDER BY m.created_at ASC
                    LIMIT $3`;
                    params = [channelId, cursorTimestamp, limit + 1];
                }
                else {
                    query = `${selectClause}
                    WHERE m.channel_id = $1 
                        AND m.deleted_at IS NULL
                        AND m.created_at > $2
                    ORDER BY m.created_at ASC
                    LIMIT $3`;
                    params = [channelId, cursorTimestamp, limit + 1];
                }
            }
            else {
                query = `${selectClause}
                WHERE m.channel_id = $1 
                    AND m.deleted_at IS NULL
                ORDER BY m.created_at ASC
                LIMIT $2`;
                params = [channelId, limit + 1];
            }
            const results = await this.dataSource.query(query, params);
            const hasMore = results.length > limit;
            const messages = hasMore ? results.slice(0, limit) : results;
            let nextCursor = null;
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                nextCursor = lastMessage.id;
            }
            const orderedMessages = messages;
            const mappedMessages = orderedMessages.map((result) => ({
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
                user: {
                    fullName: result.user_full_name,
                    avatarUrl: result.user_avatar_url,
                    email: result.user_email,
                    id: result.user_id
                }
            }));
            return {
                messages: mappedMessages,
                nextCursor: hasMore ? nextCursor : null,
                hasMore,
            };
        }
        catch (error) {
            this.logger.error('Error fetching messages:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async getMessagesByMember(req, dto, options) {
        const userId = options?.memberUserId || req.userId;
        const workspaceId = req.workspaceId;
        const channelId = dto.channelId;
        const { member, schemaName } = await this.validateWorkspaceMembership(workspaceId, userId);
        await this.validateChannelMembership(channelId, member.id, workspaceId, userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const limit = Math.min(options?.limit || 50, 100);
            const cursor = options?.cursor;
            const direction = options?.direction || 'before';
            let query;
            let params;
            if (cursor) {
                const [cursorMessage] = await this.dataSource.query(`SELECT created_at FROM "${schemaName}".messages 
           WHERE id = $1 AND channel_id = $2 AND member_id = $3 AND deleted_at IS NULL`, [cursor, channelId, member.id]);
                if (!cursorMessage) {
                    throw new Error('Invalid cursor: message not found');
                }
                const cursorTimestamp = cursorMessage.created_at;
                if (direction === 'before') {
                    query = `SELECT * FROM "${schemaName}".messages 
                   WHERE channel_id = $1 
                   AND member_id = $2
                   AND deleted_at IS NULL
                   AND created_at < $3
                   ORDER BY created_at DESC
                   LIMIT $4`;
                    params = [channelId, member.id, cursorTimestamp, limit + 1];
                }
                else {
                    query = `SELECT * FROM "${schemaName}".messages 
                   WHERE channel_id = $1 
                   AND member_id = $2
                   AND deleted_at IS NULL
                   AND created_at > $3
                   ORDER BY created_at ASC
                   LIMIT $4`;
                    params = [channelId, member.id, cursorTimestamp, limit + 1];
                }
            }
            else {
                query = `SELECT * FROM "${schemaName}".messages 
                 WHERE channel_id = $1 
                 AND member_id = $2
                 AND deleted_at IS NULL
                 ORDER BY created_at DESC
                 LIMIT $3`;
                params = [channelId, member.id, limit + 1];
            }
            const results = await this.dataSource.query(query, params);
            const hasMore = results.length > limit;
            const messages = hasMore ? results.slice(0, limit) : results;
            let nextCursor = null;
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                nextCursor = lastMessage.id;
            }
            const orderedMessages = direction === 'after' ? messages.reverse() : messages;
            const mappedMessages = orderedMessages.map((result) => ({
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
            this.logger.log(`Retrieved ${mappedMessages.length} messages by member ${member.id} in channel ${channelId}`);
            return {
                messages: mappedMessages,
                nextCursor: hasMore ? nextCursor : null,
                hasMore,
            };
        }
        catch (error) {
            this.logger.error('Error fetching messages by member:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async getMessageById(req, messageId) {
        const workspaceId = req.workspaceId;
        const userId = req.userId;
        const { member, schemaName } = await this.validateWorkspaceMembership(workspaceId, userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const [result] = await this.dataSource.query(`SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`, [messageId]);
            if (!result) {
                return null;
            }
            await this.validateChannelMembership(result.channel_id, member.id, workspaceId, userId);
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
        }
        catch (error) {
            this.logger.error('Error fetching message:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async updateMessageBySender(req, messageId, dto) {
        const { newContent } = dto;
        const { member, schemaName } = await this.validateWorkspaceMembership(req.workspaceId, req.userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const [existingMessage] = await this.dataSource.query(`SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND member_id = $2 AND deleted_at IS NULL
         LIMIT 1`, [messageId, member.id]);
            if (!existingMessage) {
                throw custom_errors_1.customError.forbidden('Message not found or you do not have permission to update it');
            }
            await this.validateChannelMembership(existingMessage.channel_id, member.id, req.workspaceId, req.userId);
            const [result] = await this.dataSource.query(`UPDATE "${schemaName}".messages 
         SET content = $1, is_edited = true, updated_at = NOW()
         WHERE id = $2 AND member_id = $3
         RETURNING *`, [newContent, messageId, member.id]);
            if (!result) {
                throw custom_errors_1.customError.internalServerError('Failed to update message');
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
        }
        catch (error) {
            this.logger.error('Error updating message:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async deleteMessageBySender(req, messageId) {
        const { member, schemaName } = await this.validateWorkspaceMembership(req.workspaceId, req.userId);
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const [existingMessage] = await this.dataSource.query(`SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND member_id = $2 AND deleted_at IS NULL
         LIMIT 1`, [messageId, member.id]);
            if (!existingMessage) {
                throw custom_errors_1.customError.forbidden('Message not found or you do not have permission to delete it');
            }
            await this.validateChannelMembership(existingMessage.channel_id, member.id, req.workspaceId, req.userId);
            const [result] = await this.dataSource.query(`UPDATE "${schemaName}".messages 
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND member_id = $2
         RETURNING id`, [messageId, member.id]);
            if (!result) {
                throw custom_errors_1.customError.internalServerError('Failed to delete message');
            }
            this.logger.log(`Message ${messageId} soft deleted by sender ${req.userId} in workspace ${req.workspaceId}`);
            return {
                success: true,
                message: 'Message deleted successfully',
            };
        }
        catch (error) {
            this.logger.error('Error deleting message:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async deleteMessageByAdmin(req, messageId) {
        const userId = req.userId;
        const workspaceId = req.workspaceId;
        const { workspace, member, schemaName } = await this.validateWorkspaceMembership(workspaceId, userId);
        const isOwner = workspace.ownerId === userId || workspace.createdBy === userId;
        const isAdmin = member.role === 'admin' || member.role === 'owner';
        if (!isOwner && !isAdmin) {
            throw custom_errors_1.customError.forbidden('Only workspace owners and admins can delete messages');
        }
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const [existingMessage] = await this.dataSource.query(`SELECT * FROM "${schemaName}".messages 
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`, [messageId]);
            if (!existingMessage) {
                throw custom_errors_1.customError.notFound('Message not found or already deleted');
            }
            await this.validateChannelMembership(existingMessage.channel_id, member.id, workspaceId, userId);
            const [result] = await this.dataSource.query(`UPDATE "${schemaName}".messages 
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id`, [messageId]);
            if (!result) {
                throw custom_errors_1.customError.internalServerError('Failed to delete message');
            }
            this.logger.log(`Message ${messageId} soft deleted by admin ${userId} in workspace ${workspaceId}`);
            return {
                success: true,
                message: 'Message deleted successfully by admin',
            };
        }
        catch (error) {
            this.logger.error('Error deleting message by admin:', error);
            throw error;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => workspace_service_1.WorkspacesService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => member_service_1.MemberService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => channel_membership_service_1.ChannelMembershipService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => channel_query_service_1.ChannelQueryService))),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        workspace_service_1.WorkspacesService,
        member_service_1.MemberService,
        channel_membership_service_1.ChannelMembershipService,
        channel_query_service_1.ChannelQueryService])
], MessageService);
//# sourceMappingURL=message.service.js.map