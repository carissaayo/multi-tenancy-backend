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
var ChannelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
const common_1 = require("@nestjs/common");
const channel_lifecycle_service_1 = require("./channel-lifecycle.service");
const channel_membership_service_1 = require("./channel-membership.service");
const member_service_1 = require("../../members/services/member.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const messaging_gateway_1 = require("../../messages/gateways/messaging.gateway");
const permission_interface_1 = require("../../../core/security/interfaces/permission.interface");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
let ChannelService = ChannelService_1 = class ChannelService {
    memberService;
    channelLifecycleService;
    channelMembershipService;
    tokenManager;
    messagingGateway;
    logger = new common_1.Logger(ChannelService_1.name);
    constructor(memberService, channelLifecycleService, channelMembershipService, tokenManager, messagingGateway) {
        this.memberService = memberService;
        this.channelLifecycleService = channelLifecycleService;
        this.channelMembershipService = channelMembershipService;
        this.tokenManager = tokenManager;
        this.messagingGateway = messagingGateway;
    }
    async createChannel(req, dto) {
        const user = req.user;
        const workspace = req.workspace;
        const canManageChannels = await this.hasChannelManagementPermission(workspace.id, user.id, workspace);
        if (!canManageChannels) {
            throw custom_errors_1.customError.forbidden('You do not have permission to create channels in this workspace');
        }
        const channel = await this.channelLifecycleService.createChannel(user, workspace, dto);
        this.messagingGateway.emitToWorkspace(workspace.id, 'channelCreated', {
            channel: {
                id: channel.id,
                name: channel.name,
                description: channel.description,
                isPrivate: channel.isPrivate,
                createdBy: channel.createdBy,
                createdAt: channel.createdAt,
                updatedAt: channel.updatedAt,
            },
            workspaceId: workspace.id,
        });
        this.logger.log(`Channel ${channel.id} created, WebSocket event emitted`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Channel created successfully',
            channel: channel,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async updateChannel(req, id, updateDto) {
        const user = req.user;
        const workspace = req.workspace;
        const canManageChannels = await this.hasChannelManagementPermission(workspace.id, user.id, workspace);
        if (!canManageChannels) {
            throw custom_errors_1.customError.forbidden('You do not have permission to create channels in this workspace');
        }
        const updatedChannel = await this.channelLifecycleService.updateChannel(req, id, updateDto);
        this.messagingGateway.emitToWorkspace(workspace.id, 'channelUpdated', {
            channel: {
                id: updatedChannel.id,
                name: updatedChannel.name,
                description: updatedChannel.description,
                isPrivate: updatedChannel.isPrivate,
                updatedAt: updatedChannel.updatedAt,
            },
            workspaceId: workspace.id,
        });
        this.logger.log(`Channel ${id} updated, WebSocket event emitted`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Channel updated successfully',
            channel: updatedChannel,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async getChannel(req, id) {
        return this.channelMembershipService.getChannel(req, id);
    }
    async getAllChannelsInAWorkspace(req) {
        return this.channelMembershipService.getAllChannelsInAWorkspace(req);
    }
    async deleteChannel(req, id) {
        const user = req.user;
        const workspace = req.workspace;
        const canManageChannels = await this.hasChannelManagementPermission(workspace.id, user.id, workspace);
        if (!canManageChannels) {
            throw custom_errors_1.customError.forbidden('You do not have permission to delete channels in this workspace');
        }
        await this.channelLifecycleService.deleteChannel(req, id);
        this.messagingGateway.emitToWorkspace(workspace.id, 'channelDeleted', {
            channelId: id,
            workspaceId: workspace.id,
        });
        this.logger.log(`Channel ${id} deleted, WebSocket event emitted`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Channel deleted successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async hasChannelManagementPermission(workspaceId, userId, workspace) {
        if (workspace.createdBy === userId || workspace.ownerId === userId) {
            this.logger.debug(`User ${userId} is the owner of workspace ${workspaceId}`);
            return true;
        }
        const member = await this.memberService.isUserMember(workspaceId, userId);
        if (!member || !member.isActive) {
            this.logger.warn(`User ${userId} is not an active member of workspace ${workspaceId}`);
            return false;
        }
        const channelManagementPermissions = [
            permission_interface_1.PermissionsEnum.CHANNEL_CREATE,
            permission_interface_1.PermissionsEnum.CHANNEL_UPDATE,
            permission_interface_1.PermissionsEnum.CHANNEL_DELETE,
            permission_interface_1.PermissionsEnum.CHANNEL_ARCHIVE,
            permission_interface_1.PermissionsEnum.CHANNEL_MANAGE_MEMBERS,
        ];
        const hasPermission = channelManagementPermissions.some((permission) => member.permissions?.includes(permission.toString()));
        const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
        const canManageChannels = hasPermission || isOwnerOrAdmin;
        if (!canManageChannels) {
            this.logger.warn(`User ${userId} does not have channel management permission in workspace ${workspaceId}`);
        }
        return canManageChannels;
    }
    async getChannelMembers(req, id) {
        return this.channelMembershipService.getChannelMembers(req, id);
    }
};
exports.ChannelService = ChannelService;
exports.ChannelService = ChannelService = ChannelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => messaging_gateway_1.MessagingGateway))),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        channel_lifecycle_service_1.ChannelLifecycleService,
        channel_membership_service_1.ChannelMembershipService,
        token_manager_service_1.TokenManager,
        messaging_gateway_1.MessagingGateway])
], ChannelService);
//# sourceMappingURL=channel.service.js.map