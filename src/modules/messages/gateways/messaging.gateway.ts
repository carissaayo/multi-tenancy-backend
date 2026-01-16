import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import type { AuthenticatedSocket } from '../interfaces/aurthenticated-socket.interface';
import { MessageService } from '../services/message.service';

@WebSocketGateway({
  cors: {
    // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    origin:'http://localhost:8000',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  // Store active connections: userId -> socketId[]
  private userSockets = new Map<string, Set<string>>();

  // Store workspace rooms: workspaceId -> Set of socketIds
  private workspaceRooms = new Map<string, Set<string>>();

  constructor(private readonly messageService: MessageService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);

    try {
      // Extract token from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Token validation will happen in WsAuthGuard for message handlers
      // For now, just log the connection attempt
      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up user socket mappings
    this.userSockets.forEach((sockets, userId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    });

    // Clean up workspace rooms
    this.workspaceRooms.forEach((sockets, workspaceId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.workspaceRooms.delete(workspaceId);
      }
    });
  }

  // Join a workspace room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinWorkspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const { workspaceId } = data;
    const roomName = `workspace:${workspaceId}`;

    await client.join(roomName);

    // Track the connection
    if (!this.workspaceRooms.has(workspaceId)) {
      this.workspaceRooms.set(workspaceId, new Set());
    }
    this.workspaceRooms.get(workspaceId)!.add(client.id);

    // Track user socket
    if (!this.userSockets.has(client.userId)) {
      this.userSockets.set(client.userId, new Set());
    }
    this.userSockets.get(client.userId)!.add(client.id);

    this.logger.log(
      `Client ${client.id} (user: ${client.userId}) joined workspace ${workspaceId}`,
    );

    return {
      event: 'joinedWorkspace',
      data: { workspaceId, success: true },
    };
  }

  // Leave a workspace room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leaveWorkspace')
  async handleLeaveWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string },
  ) {
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

  // Join a channel room
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;
    const roomName = `channel:${channelId}`;

    await client.join(roomName);

    this.logger.log(`Client ${client.id} joined channel ${channelId}`);

    return {
      event: 'joinedChannel',
      data: { channelId, success: true },
    };
  }

  // Send message to channel
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      channelId: string;
      content: string;
      workspaceId: string;
      threadId?: string;
    },
  ) {
    const { channelId, content, workspaceId, threadId } = data;

    if (!content || content.trim().length === 0) {
      return {
        event: 'error',
        data: { message: 'Message content cannot be empty' },
      };
    }

    try {
      // Save message to database
      const message = await this.messageService.createMessage(
        workspaceId,
        channelId,
        client.userId,
        content.trim(),
        threadId,
      );

      // Prepare message payload for clients
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
        userId: client.userId, // Include userId for client convenience
      };

      // Emit to all clients in the channel
      this.server.to(`channel:${channelId}`).emit('newMessage', messagePayload);

      this.logger.log(
        `Message sent by user ${client.userId} in channel ${channelId}`,
      );

      return {
        event: 'messageSent',
        data: { success: true, message: messagePayload },
      };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return {
        event: 'error',
        data: {
          message: error.message || 'Failed to send message',
        },
      };
    }
  }

  // Typing indicator
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; isTyping: boolean },
  ) {
    const { channelId, isTyping } = data;

    // Broadcast to everyone in channel except sender
    client.to(`channel:${channelId}`).emit('userTyping', {
      userId: client.userId,
      channelId,
      isTyping,
    });
  }

  // Utility method to emit to specific user (all their connections)
  emitToUser(userId: string, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Utility method to emit to workspace
  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.logger.log(`Emitting to workspace ${workspaceId} event ${event}`);
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Utility method to emit to channel
  emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  /**
   * Programmatically join a user to a workspace room
   * This can be called from services when a user joins a workspace
   */
  async joinUserToWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const userSocketIds = this.userSockets.get(userId);

    if (!userSocketIds || userSocketIds.size === 0) {
      // User has no active WebSocket connections
      this.logger.debug(
        `User ${userId} has no active WebSocket connections to join workspace ${workspaceId}`,
      );
      return;
    }

    const roomName = `workspace:${workspaceId}`;

    // Join all user's socket connections to the workspace room
    for (const socketId of userSocketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await socket.join(roomName);

        // Track the connection
        if (!this.workspaceRooms.has(workspaceId)) {
          this.workspaceRooms.set(workspaceId, new Set());
        }
        this.workspaceRooms.get(workspaceId)!.add(socketId);

        this.logger.log(
          `Socket ${socketId} (user: ${userId}) joined workspace ${workspaceId}`,
        );
      }
    }

    // Emit confirmation to the user
    this.emitToUser(userId, 'workspaceJoined', {
      workspaceId,
      success: true,
      message: 'You have been automatically joined to the workspace',
    });
  }
}
