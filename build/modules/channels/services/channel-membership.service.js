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
var ChannelMembershipService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMembershipService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const member_service_1 = require("../../members/services/member.service");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const channel_query_service_1 = require("./channel-query.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const workspace_entity_1 = require("../../workspaces/entities/workspace.entity");
const typeorm_3 = require("typeorm");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
let ChannelMembershipService = ChannelMembershipService_1 = class ChannelMembershipService {
    dataSource;
    workspaceRepo;
    workspacesService;
    memberService;
    channelQueryService;
    tokenManager;
    logger = new common_1.Logger(ChannelMembershipService_1.name);
    constructor(dataSource, workspaceRepo, workspacesService, memberService, channelQueryService, tokenManager) {
        this.dataSource = dataSource;
        this.workspaceRepo = workspaceRepo;
        this.workspacesService = workspacesService;
        this.memberService = memberService;
        this.channelQueryService = channelQueryService;
        this.tokenManager = tokenManager;
    }
    async isUserMember(channelId, memberId, workspaceId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`SELECT 1 FROM "${schemaName}".channel_members WHERE channel_id = $1 AND member_id = $2`, [channelId, memberId]);
            return result.length > 0;
        }
        catch (error) {
            this.logger.error(`Error checking channel membership in schema ${schemaName}: ${error.message}`);
            return false;
        }
    }
    async getChannel(req, id) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        const isAMember = await this.isUserMember(id, member.id, workspace.id);
        if (!isAMember) {
            throw custom_errors_1.customError.forbidden('You are not a member of this channel');
        }
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            channel: channel,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Channel retrieved successfully',
        };
    }
    async getAllChannelsInAWorkspace(req) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const channels = await this.channelQueryService.findAllChannelsInAWorkspace(workspace.id, member.id);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            channels: channels,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Channels retrieved successfully',
        };
    }
    a;
};
exports.ChannelMembershipService = ChannelMembershipService;
exports.ChannelMembershipService = ChannelMembershipService = ChannelMembershipService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_3.Repository,
        workspace_service_1.WorkspacesService,
        member_service_1.MemberService,
        channel_query_service_1.ChannelQueryService,
        token_manager_service_1.TokenManager])
], ChannelMembershipService);
//# sourceMappingURL=channel-membership.service.js.map