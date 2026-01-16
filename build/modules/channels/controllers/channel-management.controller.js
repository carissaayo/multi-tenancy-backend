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
exports.ChannelManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_management_service_1 = require("../services/channel-management.service");
const channel_management_dto_1 = require("../dtos/channel-management.dto");
let ChannelManagementController = class ChannelManagementController {
    channelManagementService;
    constructor(channelManagementService) {
        this.channelManagementService = channelManagementService;
    }
    joinChannel(req, id) {
        return this.channelManagementService.joinChannel(req, id);
    }
    leaveChannel(req, id) {
        return this.channelManagementService.leaveChannel(req, id);
    }
    removeMemberFromChannel(req, id, dto) {
        return this.channelManagementService.removeMemberFromChannel(req, id, dto);
    }
};
exports.ChannelManagementController = ChannelManagementController;
__decorate([
    (0, common_1.Patch)(':id/join'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Join a channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'You have successfully joined the channel',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelManagementController.prototype, "joinChannel", null);
__decorate([
    (0, common_1.Patch)(':id/leave'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave a channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'You have successfully left the channel',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelManagementController.prototype, "leaveChannel", null);
__decorate([
    (0, common_1.Delete)(':id/members/remove'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a member from a channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member removed from channel successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, channel_management_dto_1.RemoveMemberFromChannelDto]),
    __metadata("design:returntype", void 0)
], ChannelManagementController.prototype, "removeMemberFromChannel", null);
exports.ChannelManagementController = ChannelManagementController = __decorate([
    (0, swagger_1.ApiTags)('Channel Management'),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_management_service_1.ChannelManagementService])
], ChannelManagementController);
//# sourceMappingURL=channel-management.controller.js.map