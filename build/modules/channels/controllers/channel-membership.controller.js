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
exports.ChannelMembershipController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_membership_service_1 = require("../services/channel-membership.service");
let ChannelMembershipController = class ChannelMembershipController {
    channelMembershipService;
    constructor(channelMembershipService) {
        this.channelMembershipService = channelMembershipService;
    }
    getChannelMembers(req, id) {
        return this.channelMembershipService.getChannelMembers(req, id);
    }
};
exports.ChannelMembershipController = ChannelMembershipController;
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get channel members' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel members retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelMembershipController.prototype, "getChannelMembers", null);
exports.ChannelMembershipController = ChannelMembershipController = __decorate([
    (0, swagger_1.ApiTags)('Channel Membership'),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_membership_service_1.ChannelMembershipService])
], ChannelMembershipController);
//# sourceMappingURL=channel-membership.controller.js.map