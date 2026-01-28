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
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const message_service_1 = require("../services/message.service");
const swagger_1 = require("@nestjs/swagger");
const message_dto_1 = require("../dtos/message.dto");
let MessageController = class MessageController {
    messageService;
    constructor(messageService) {
        this.messageService = messageService;
    }
    createMessage(req, dto) {
        return this.messageService.createMessage(req.workspaceId, dto.channelId, req.userId, dto.content, dto.threadId);
    }
    getChannelMessages(req, channelId, limit, cursor, direction) {
        return this.messageService.getChannelMessages(req, channelId);
    }
    getMyMessages(req, channelId, limit, cursor, direction) {
        req.query = {
            ...req.query,
            limit: limit?.toString(),
            cursor,
            direction
        };
        return this.messageService.getMessagesByMember(req, { channelId: channelId || '' }, { limit, cursor, direction });
    }
    getMemberMessages(req, memberId, channelId, limit, cursor, direction) {
        req.query = {
            ...req.query,
            limit: limit?.toString(),
            cursor,
            direction
        };
        return this.messageService.getMessagesByMember(req, { channelId: channelId || '' }, { limit, cursor, direction, memberUserId: memberId });
    }
    getSingleMessage(req, messageId) {
        return this.messageService.getMessageById(req, messageId);
    }
    updateMessageBySender(req, messageId, dto) {
        return this.messageService.updateMessageBySender(req, messageId, dto);
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new message' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "createMessage", null);
__decorate([
    (0, common_1.Get)('channel/:channelId'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages from a channel' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('cursor')),
    __param(4, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String, String]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "getChannelMessages", null);
__decorate([
    (0, common_1.Get)('member'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages by current member' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('channelId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('cursor')),
    __param(4, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, String, String]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "getMyMessages", null);
__decorate([
    (0, common_1.Get)('member/:memberId'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages by specific member' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Query)('channelId')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('cursor')),
    __param(5, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, String, String]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "getMemberMessages", null);
__decorate([
    (0, common_1.Get)(':messageId'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single message' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "getSingleMessage", null);
__decorate([
    (0, common_1.Patch)(':messageId'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update message by sender' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, message_dto_1.UpdateMessageDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "updateMessageBySender", null);
exports.MessageController = MessageController = __decorate([
    (0, swagger_1.ApiTags)("Messages"),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], MessageController);
//# sourceMappingURL=message.controller.js.map