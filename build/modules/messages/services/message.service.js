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
let MessageService = MessageService_1 = class MessageService {
    dataSource;
    workspacesService;
    memberService;
    logger = new common_1.Logger(MessageService_1.name);
    constructor(dataSource, workspacesService, memberService) {
        this.dataSource = dataSource;
        this.workspacesService = workspacesService;
        this.memberService = memberService;
    }
    async createMessage(workspaceId, channelId, userId, content, threadId) {
        const workspace = await this.workspacesService.findById(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        const member = await this.memberService.isUserMember(workspaceId, userId);
        if (!member) {
            throw new Error('User is not a member of this workspace');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
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
    async getChannelMessages(workspaceId, channelId, limit = 50, offset = 0) {
        const workspace = await this.workspacesService.findById(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const results = await this.dataSource.query(`SELECT * FROM "${schemaName}".messages 
         WHERE channel_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [channelId, limit, offset]);
            return results.map((result) => ({
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
        }
        catch (error) {
            this.logger.error('Error fetching messages:', error);
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
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        workspace_service_1.WorkspacesService,
        member_service_1.MemberService])
], MessageService);
//# sourceMappingURL=message.service.js.map