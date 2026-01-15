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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelInviteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_invite_service_1 = require("../services/channel-invite.service");
const channel_invite_dto_1 = require("../dtos/channel-invite.dto");
let ChannelInviteController = class ChannelInviteController {
    channelInviteService;
    constructor(channelInviteService) {
        this.channelInviteService = channelInviteService;
    }
    inviteToJoinPrivateChannel(req, id, channelInviteDto) {
        return this.channelInviteService.inviteToJoinPrivateChannel(req, id, channelInviteDto);
    }
    revokeInvitation(invitationId, req) {
        return this.channelInviteService.revokeInvitation(invitationId, req);
    }
    acceptInvitation(token) {
        return this.channelInviteService.acceptInvitation(token);
    }
};
exports.ChannelInviteController = ChannelInviteController;
__decorate([
    (0, common_1.Patch)(':id/invite'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a member to join a private channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'You have successfully invited a member to join a private channel',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, channel_invite_dto_1.ChannelInviteDto]),
    __metadata("design:returntype", void 0)
], ChannelInviteController.prototype, "inviteToJoinPrivateChannel", null);
__decorate([
    (0, common_1.Patch)(':invitationId/revoke'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a channel invitation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel invitation revoked successfully',
    }),
    __param(0, (0, common_1.Param)('invitationId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChannelInviteController.prototype, "revokeInvitation", null);
__decorate([
    (0, common_1.Patch)('invitations/accept'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a channel invitation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel invitation accepted successfully',
    }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChannelInviteController.prototype, "acceptInvitation", null);
exports.ChannelInviteController = ChannelInviteController = __decorate([
    (0, swagger_1.ApiTags)('Channel Invitations'),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_invite_service_1.ChannelInviteService])
], ChannelInviteController);
//# sourceMappingURL=channel-invite.controller.js.map