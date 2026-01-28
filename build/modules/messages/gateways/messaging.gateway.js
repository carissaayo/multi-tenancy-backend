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
const auth_domain_service_1 = require("../../../core/security/services/auth-domain.service");
const user_service_1 = require("../../users/services/user.service");
let MessagingGateway = MessagingGateway_1 = class MessagingGateway {
    messageService;
    authDomain;
    userService;
    server;
    logger = new common_1.Logger(MessagingGateway_1.name);
    userSockets = new Map();
    workspaceRooms = new Map();
    constructor(messageService, authDomain, userService) {
        this.messageService = messageService;
        this.authDomain = authDomain;
        this.userService = userService;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        this.logger.log(`Client attempting to connect: ${client.id}`);
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} rejected: No token provided`);
                client.emit('error', {
                    message: 'Authentication required',
                    code: 'NO_TOKEN'
                });
                setTimeout(() => {
                    if (client.connected) {
                        client.disconnect(true);
                    }
                }, 100);
                return;
            }
            const auth = await this.authDomain.validateAccessToken(token);
            client.userId = auth.userId;
            client.workspaceId = auth.workspaceId;
            if (!this.userSockets.has(auth.userId)) {
                this.userSockets.set(auth.userId, new Set());
            }
            this.userSockets.get(auth.userId).add(client.id);
            this.logger.log(`Client ${client.id} connected successfully (user: ${auth.userId})`);
        }
        catch (error) {
            this.logger.warn(`Client ${client.id} authentication failed: ${error?.message || 'Unknown error'}`);
            client.emit('error', {
                message: error?.message || 'Authentication failed',
                code: error?.code || 'AUTH_FAILED'
            });
            setTimeout(() => {
                if (client.connected) {
                    client.disconnect(true);
                }
            }, 100);
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
            const user = await this.userService.findById(client.userId);
            if (!user) {
                throw new Error('User not found');
            }
            const userDetails = this.userService.getUserProfile(user);
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
                user: {
                    id: client.userId,
                    fullName: userDetails.fullName,
                    avatarUrl: userDetails.avatarUrl,
                    email: userDetails.email,
                }
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
    async handleTyping(client, data) {
        const { channelId, isTyping } = data;
        const user = await this.userService.findById(client.userId);
        if (!user) {
            throw new Error('User not found');
        }
        const userProfile = await this.userService.getUserProfile(user);
        client.to(`channel:${channelId}`).emit('userTyping', {
            userId: client.userId,
            userName: userProfile?.userName,
            fullName: userProfile?.fullName,
            channelId,
            isTyping,
        });
    }
    async handleLeaveChannel(client, data) {
        const { channelId } = data;
        const roomName = `channel:${channelId}`;
        await client.leave(roomName);
        this.logger.log(`Client ${client.id} left channel ${channelId}`);
        return {
            event: 'leftChannel',
            data: { channelId, success: true },
        };
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
        this.logger.log(`Emitting to workspace ${workspaceId} event ${event}`);
        this.server.to(`workspace:${workspaceId}`).emit(event, data);
    }
    emitToChannel(channelId, event, data) {
        this.server.to(`channel:${channelId}`).emit(event, data);
    }
    async joinUserToWorkspace(userId, workspaceId) {
        const userSocketIds = this.userSockets.get(userId);
        if (!userSocketIds || userSocketIds.size === 0) {
            this.logger.debug(`User ${userId} has no active WebSocket connections to join workspace ${workspaceId}`);
            return;
        }
        const roomName = `workspace:${workspaceId}`;
        const namespace = this.server.of('/messaging');
        for (const socketId of userSocketIds) {
            try {
                const socket = namespace.sockets.get(socketId);
                if (socket) {
                    await socket.join(roomName);
                    if (!this.workspaceRooms.has(workspaceId)) {
                        this.workspaceRooms.set(workspaceId, new Set());
                    }
                    this.workspaceRooms.get(workspaceId).add(socketId);
                    this.logger.log(`Socket ${socketId} (user: ${userId}) joined workspace ${workspaceId}`);
                }
                else {
                    this.logger.warn(`Socket ${socketId} not found in namespace, may have disconnected`);
                    userSocketIds.delete(socketId);
                }
            }
            catch (error) {
                this.logger.error(`Error joining socket ${socketId} to workspace ${workspaceId}:`, error);
            }
        }
        this.emitToUser(userId, 'workspaceJoined', {
            workspaceId,
            success: true,
            message: 'You have been automatically joined to the workspace',
        });
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
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleTyping", null);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('leaveChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleLeaveChannel", null);
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/messaging',
    }),
    __metadata("design:paramtypes", [message_service_1.MessageService,
        auth_domain_service_1.AuthDomainService,
        user_service_1.UsersService])
], MessagingGateway);
//# sourceMappingURL=messaging.gateway.js.map