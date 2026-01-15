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
var ChannelQueryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelQueryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const workspace_entity_1 = require("../../workspaces/entities/workspace.entity");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
let ChannelQueryService = ChannelQueryService_1 = class ChannelQueryService {
    dataSource;
    workspaceRepo;
    workspacesService;
    logger = new common_1.Logger(ChannelQueryService_1.name);
    constructor(dataSource, workspaceRepo, workspacesService) {
        this.dataSource = dataSource;
        this.workspaceRepo = workspaceRepo;
        this.workspacesService = workspacesService;
    }
    async findChannelById(channelId, workspaceId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
        SELECT id, name, description, is_private, created_by, created_at, updated_at
        FROM "${schemaName}".channels
        WHERE id = $1
        LIMIT 1
        `, [channelId]);
            if (!result || result.length === 0) {
                return null;
            }
            const channelData = result[0];
            const channel = {
                id: channelData.id,
                name: channelData.name,
                description: channelData.description,
                isPrivate: channelData.is_private,
                createdBy: channelData.created_by,
                createdAt: channelData.created_at,
                updatedAt: channelData.updated_at,
            };
            return channel;
        }
        catch (error) {
            this.logger.error(`Error finding channel ${channelId} in workspace ${workspaceId}: ${error.message}`);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to find channel');
        }
    }
    async findAllChannelsInAWorkspace(workspaceId, memberId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            let query = `
        SELECT DISTINCT c.id, c.name, c.description, c.is_private, c.created_by, c.created_at, c.updated_at
        FROM "${schemaName}".channels c
        WHERE c.is_private = false
      `;
            const params = [];
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
            const channels = result.map((channel) => ({
                id: channel.id,
                name: channel.name,
                description: channel.description,
                isPrivate: channel.is_private,
                createdBy: channel.created_by,
                createdAt: channel.created_at,
                updatedAt: channel.updated_at,
            }));
            return channels;
        }
        catch (error) {
            this.logger.error(`Error finding all channels in workspace ${workspaceId}: ${error.message}`);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to find channels');
        }
    }
};
exports.ChannelQueryService = ChannelQueryService;
exports.ChannelQueryService = ChannelQueryService = ChannelQueryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_3.Repository,
        workspace_service_1.WorkspacesService])
], ChannelQueryService);
//# sourceMappingURL=channel-query.service.js.map