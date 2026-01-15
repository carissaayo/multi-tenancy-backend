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
const member_service_1 = require("../../members/services/member.service");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const channel_query_service_1 = require("./channel-query.service");
const channel_membership_service_1 = require("./channel-membership.service");
let ChannelManagementService = ChannelManagementService_1 = class ChannelManagementService {
    workspacesService;
    memberService;
    channelQueryService;
    channelMembershipService;
    tokenManager;
    logger = new common_1.Logger(ChannelManagementService_1.name);
    constructor(workspacesService, memberService, channelQueryService, channelMembershipService, tokenManager) {
        this.workspacesService = workspacesService;
        this.memberService = memberService;
        this.channelQueryService = channelQueryService;
        this.channelMembershipService = channelMembershipService;
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
            channel: joinedChannel,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
};
exports.ChannelManagementService = ChannelManagementService;
exports.ChannelManagementService = ChannelManagementService = ChannelManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [workspace_service_1.WorkspacesService,
        member_service_1.MemberService,
        channel_query_service_1.ChannelQueryService,
        channel_membership_service_1.ChannelMembershipService,
        token_manager_service_1.TokenManager])
], ChannelManagementService);
//# sourceMappingURL=channel-management.service.js.map