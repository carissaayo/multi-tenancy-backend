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
var ChannelLifecycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelLifecycleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const member_service_1 = require("../../members/services/member.service");
const channel_query_service_1 = require("./channel-query.service");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
let ChannelLifecycleService = ChannelLifecycleService_1 = class ChannelLifecycleService {
    dataSource;
    memberService;
    workspaceService;
    channelQueryService;
    logger = new common_1.Logger(ChannelLifecycleService_1.name);
    constructor(dataSource, memberService, workspaceService, channelQueryService) {
        this.dataSource = dataSource;
        this.memberService = memberService;
        this.workspaceService = workspaceService;
        this.channelQueryService = channelQueryService;
    }
    async createChannel(user, workspace, dto) {
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.notFound('You are not a member of this workspace');
        }
        const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
        INSERT INTO "${schemaName}".channels
          (name, description, is_private, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, description, is_private, created_by, created_at, updated_at
        `, [dto.name, dto.description || null, dto.isPrivate || false, user.id]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to create channel');
            }
            const channelData = result[0];
            await this.dataSource.query(`
        INSERT INTO "${schemaName}".channel_members
          (channel_id, member_id, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (channel_id, member_id) DO NOTHING
        `, [channelData.id, member.id]);
            const channel = {
                id: channelData.id,
                name: channelData.name,
                description: channelData.description,
                isPrivate: channelData.is_private,
                createdBy: channelData.created_by,
                createdAt: channelData.created_at,
                updatedAt: channelData.updated_at,
            };
            this.logger.log(`Channel created: ${channel.name} (${channel.id}) in workspace ${workspace.id} by user ${user.id}`);
            return channel;
        }
        catch (error) {
            this.logger.error(`Error creating channel in workspace ${workspace.id}: ${error.message}`);
            if (error.code === '23505') {
                throw custom_errors_1.customError.badRequest('A channel with this name already exists in this workspace');
            }
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to create channel');
        }
    }
    async updateChannel(req, id, updateDto) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.notFound('You are not a member of this workspace');
        }
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const updateFields = [];
            const updateValues = [];
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
                throw custom_errors_1.customError.badRequest('No fields to update');
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
                throw custom_errors_1.customError.internalServerError('Failed to update channel');
            }
            const rows = Array.isArray(result[0]) ? result[0] : result;
            const channelData = rows[0];
            if (!channelData) {
                throw custom_errors_1.customError.internalServerError('Failed to update channel');
            }
            const updatedChannel = {
                id: channelData.id,
                name: channelData.name,
                description: channelData.description,
                isPrivate: channelData.is_private,
                createdBy: channelData.created_by,
                createdAt: channelData.created_at,
                updatedAt: channelData.updated_at,
            };
            if (!updatedChannel.id || !updatedChannel.name) {
                this.logger.error(`Invalid channel data returned: ${JSON.stringify(channelData)}`);
                throw custom_errors_1.customError.internalServerError('Invalid channel data returned from update');
            }
            this.logger.log(`Channel updated: ${updatedChannel.name} (${updatedChannel.id}) in workspace ${workspace.id} by user ${user.id}`);
            return updatedChannel;
        }
        catch (error) {
            this.logger.error(`Error updating channel ${id} in workspace ${workspace.id}: ${error.message}`, error.stack);
            if (error.code === '23505') {
                throw custom_errors_1.customError.badRequest('A channel with this name already exists in this workspace');
            }
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to update channel');
        }
    }
    async deleteChannel(req, id) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.notFound('You are not a member of this workspace');
        }
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
        DELETE FROM "${schemaName}".channels
        WHERE id = $1
        RETURNING id, name
        `, [id]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to delete channel');
            }
            const rows = Array.isArray(result[0]) ? result[0] : result;
            const deletedChannel = rows[0];
            if (!deletedChannel) {
                throw custom_errors_1.customError.internalServerError('Failed to delete channel');
            }
            this.logger.log(`Channel deleted: ${deletedChannel.name} (${deletedChannel.id}) in workspace ${workspace.id} by user ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Error deleting channel ${id} in workspace ${workspace.id}: ${error.message}`, error.stack);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to delete channel');
        }
    }
};
exports.ChannelLifecycleService = ChannelLifecycleService;
exports.ChannelLifecycleService = ChannelLifecycleService = ChannelLifecycleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        member_service_1.MemberService,
        workspace_service_1.WorkspacesService,
        channel_query_service_1.ChannelQueryService])
], ChannelLifecycleService);
//# sourceMappingURL=channel-lifecycle.service.js.map