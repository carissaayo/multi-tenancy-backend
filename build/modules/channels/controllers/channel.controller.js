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
exports.ChannelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_service_1 = require("../services/channel.service");
const channel_dto_1 = require("../dtos/channel.dto");
let ChannelController = class ChannelController {
    channelService;
    constructor(channelService) {
        this.channelService = channelService;
    }
    createChannel(req, createChannelDto) {
        return this.channelService.createChannel(req, createChannelDto);
    }
    updateChannel(req, id, updateChannelDto) {
        return this.channelService.updateChannel(req, id, updateChannelDto);
    }
    getChannel(req, id) {
        return this.channelService.getChannel(req, id);
    }
    getAllChannelsInAWorkspace(req) {
        return this.channelService.getAllChannelsInAWorkspace(req);
    }
    deleteChannel(req, id) {
        return this.channelService.deleteChannel(req, id);
    }
};
exports.ChannelController = ChannelController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new channel' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Channel created successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", void 0)
], ChannelController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel updated successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, channel_dto_1.UpdateChannelDto]),
    __metadata("design:returntype", void 0)
], ChannelController.prototype, "updateChannel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a channel by id' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelController.prototype, "getChannel", null);
__decorate([
    (0, common_1.Get)(''),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all channels in a workspace' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channels retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChannelController.prototype, "getAllChannelsInAWorkspace", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a channel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Channel deleted successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChannelController.prototype, "deleteChannel", null);
exports.ChannelController = ChannelController = __decorate([
    (0, swagger_1.ApiTags)('Channels'),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_service_1.ChannelService])
], ChannelController);
//# sourceMappingURL=channel.controller.js.map