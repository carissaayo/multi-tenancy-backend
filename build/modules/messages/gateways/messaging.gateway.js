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
var MessagingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ws_auth_guard_1 = require("../guards/ws-auth.guard");
const message_service_1 = require("../services/message.service");
let MessagingGateway = MessagingGateway_1 = class MessagingGateway {
    messageService;
    server;
    logger = new common_1.Logger(MessagingGateway_1.name);
    userSockets = new Map();
    workspaceRooms = new Map();
    constructor(messageService) {
        this.messageService = messageService;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        this.logger.log(`Client attempting to connect: ${client.id}`);
        try {
            const token = client.handshake.auth.token ||
                client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} rejected: No token provided`);
                client.disconnect();
                return;
            }
            this.logger.log(`Client connected: ${client.id}`);
        }
        catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.userSockets.forEach((sockets, userId) => {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        });
        this.workspaceRooms.forEach((sockets, workspaceId) => {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.workspaceRooms.delete(workspaceId);
            }
        });
    }
    async handleJoinWorkspace(client, data) {
        const { workspaceId } = data;
        const roomName = `workspace:${workspaceId}`;
        await client.join(roomName);
        if (!this.workspaceRooms.has(workspaceId)) {
            this.workspaceRooms.set(workspaceId, new Set());
        }
        this.workspaceRooms.get(workspaceId).add(client.id);
        if (!this.userSockets.has(client.userId)) {
            this.userSockets.set(client.userId, new Set());
        }
        this.userSockets.get(client.userId).add(client.id);
        this.logger.log(`Client ${client.id} (user: ${client.userId}) joined workspace ${workspaceId}`);
        return {
            event: 'joinedWorkspace',
            data: { workspaceId, success: true },
        };
    }
    async handleLeaveWorkspace(client, data) {
        const { workspaceId } = data;
        const roomName = `workspace:${workspaceId}`;
        await client.leave(roomName);
        const roomSockets = this.workspaceRooms.get(workspaceId);
        if (roomSockets) {
            roomSockets.delete(client.id);
            if (roomSockets.size === 0) {
                this.workspaceRooms.delete(workspaceId);
            }
        }
        this.logger.log(`Client ${client.id} left workspace ${workspaceId}`);
        return {
            event: 'leftWorkspace',
            data: { workspaceId, success: true },
        };
    }
    async handleJoinChannel(client, data) {
        const { channelId } = data;
        const roomName = `channel:${channelId}`;
        await client.join(roomName);
        this.logger.log(`Client ${client.id} joined channel ${channelId}`);
        return {
            event: 'joinedChannel',
            data: { channelId, success: true },
        };
    }
    async handleSendMessage(client, data) {
        const { channelId, content, workspaceId, threadId } = data;
        if (!content || content.trim().length === 0) {
            return {
                event: 'error',
                data: { message: 'Message content cannot be empty' },
            };
        }
        try {
            const message = await this.messageService.createMessage(workspaceId, channelId, client.userId, content.trim(), threadId);
            const messagePayload = {
                id: message.id,
                channelId: message.channelId,
                memberId: message.memberId,
                content: message.content,
                type: message.type,
                threadId: message.threadId,
                isEdited: message.isEdited,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                userId: client.userId,
            };
            this.server.to(`channel:${channelId}`).emit('newMessage', messagePayload);
            this.logger.log(`Message sent by user ${client.userId} in channel ${channelId}`);
            return {
                event: 'messageSent',
                data: { success: true, message: messagePayload },
            };
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            return {
                event: 'error',
                data: {
                    message: error.message || 'Failed to send message',
                },
            };
        }
    }
    handleTyping(client, data) {
        const { channelId, isTyping } = data;
        client.to(`channel:${channelId}`).emit('userTyping', {
            userId: client.userId,
            channelId,
            isTyping,
        });
    }
    emitToUser(userId, event, data) {
        const userSocketIds = this.userSockets.get(userId);
        if (userSocketIds) {
            userSocketIds.forEach((socketId) => {
                this.server.to(socketId).emit(event, data);
            });
        }
    }
    emitToWorkspace(workspaceId, event, data) {
        this.server.to(`workspace:${workspaceId}`).emit(event, data);
    }
    emitToChannel(channelId, event, data) {
        this.server.to(`channel:${channelId}`).emit(event, data);
    }
};
exports.MessagingGateway = MessagingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagingGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('joinWorkspace'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleJoinWorkspace", null);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('leaveWorkspace'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleLeaveWorkspace", null);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('joinChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MessagingGateway.prototype, "handleTyping", null);
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/messaging',
    }),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], MessagingGateway);
//# sourceMappingURL=messaging.gateway.js.map