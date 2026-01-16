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
var ChannelManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const member_service_1 = require("../../members/services/member.service");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const channel_query_service_1 = require("./channel-query.service");
const channel_membership_service_1 = require("./channel-membership.service");
const channel_service_1 = require("./channel.service");
let ChannelManagementService = ChannelManagementService_1 = class ChannelManagementService {
    dataSource;
    workspacesService;
    memberService;
    channelQueryService;
    channelMembershipService;
    channelService;
    tokenManager;
    logger = new common_1.Logger(ChannelManagementService_1.name);
    constructor(dataSource, workspacesService, memberService, channelQueryService, channelMembershipService, channelService, tokenManager) {
        this.dataSource = dataSource;
        this.workspacesService = workspacesService;
        this.memberService = memberService;
        this.channelQueryService = channelQueryService;
        this.channelMembershipService = channelMembershipService;
        this.channelService = channelService;
        this.tokenManager = tokenManager;
    }
    async joinChannel(req, id) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.notFound('You have to be a member of the workspace to join its channels');
        }
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        if (channel.isPrivate) {
            throw custom_errors_1.customError.badRequest('You need to be invited to join this private channel');
        }
        const isThisChannelMember = await this.channelMembershipService.isUserMember(id, member.id, workspace.id);
        if (isThisChannelMember) {
            throw custom_errors_1.customError.badRequest('You are already a member of this channel');
        }
        const joinedChannel = await this.channelMembershipService.joinChannel(req, id, member.id);
        if (!joinedChannel) {
            throw custom_errors_1.customError.internalServerError('Failed to join channel,try again');
        }
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'You have successfully joined the channel',
            channel: channel,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async leaveChannel(req, id) {
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
        await this.channelMembershipService.leaveChannel(id, member.id, workspace.id);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'You have successfully left the channel',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async removeMemberFromChannel(req, id, dto) {
        const { targetMemberId } = dto;
        const user = req.user;
        const workspace = req.workspace;
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        const hasPermission = await this.channelService.hasChannelManagementPermission(workspace.id, user.id, workspace);
        const isChannelCreator = channel.createdBy === user.id;
        if (!hasPermission && !isChannelCreator) {
            throw custom_errors_1.customError.forbidden('You do not have permission to remove members from this channel');
        }
        const requesterMember = await this.memberService.isUserMember(workspace.id, user.id);
        if (!requesterMember) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        if (requesterMember.id === targetMemberId) {
            throw custom_errors_1.customError.badRequest('You cannot remove yourself. But you can leave the channel.');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const [targetMember] = await this.dataSource.query(`SELECT id, user_id FROM "${schemaName}".members WHERE id = $1 AND is_active = true LIMIT 1`, [targetMemberId]);
        if (!targetMember) {
            throw custom_errors_1.customError.notFound('Target member not found in this workspace');
        }
        await this.channelMembershipService.removeMemberFromChannel(id, targetMemberId, workspace.id);
        this.logger.log(`Member ${targetMemberId} removed from channel ${id} by user ${user.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Member removed from channel successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
};
exports.ChannelManagementService = ChannelManagementService;
exports.ChannelManagementService = ChannelManagementService = ChannelManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        workspace_service_1.WorkspacesService,
        member_service_1.MemberService,
        channel_query_service_1.ChannelQueryService,
        channel_membership_service_1.ChannelMembershipService,
        channel_service_1.ChannelService,
        token_manager_service_1.TokenManager])
], ChannelManagementService);
//# sourceMappingURL=channel-management.service.js.map