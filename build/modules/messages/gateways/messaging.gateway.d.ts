import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { AuthenticatedSocket } from '../interfaces/aurthenticated-socket.interface';
import { MessageService } from '../services/message.service';
import { AuthDomainService } from 'src/core/security/services/auth-domain.service';
export declare class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly messageService;
    private readonly authDomain;
    server: Server;
    private readonly logger;
    private userSockets;
    private workspaceRooms;
    constructor(messageService: MessageService, authDomain: AuthDomainService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinWorkspace(client: AuthenticatedSocket, data: {
        workspaceId: string;
    }): Promise<{
        event: string;
        data: {
            workspaceId: string;
            success: boolean;
        };
    }>;
    handleLeaveWorkspace(client: AuthenticatedSocket, data: {
        workspaceId: string;
    }): Promise<{
        event: string;
        data: {
            workspaceId: string;
            success: boolean;
        };
    }>;
    handleJoinChannel(client: AuthenticatedSocket, data: {
        channelId: string;
    }): Promise<{
        event: string;
        data: {
            channelId: string;
            success: boolean;
        };
    }>;
    handleSendMessage(client: AuthenticatedSocket, data: {
        channelId: string;
        content: string;
        workspaceId: string;
        threadId?: string;
    }): Promise<{
        event: string;
        data: {
            success: boolean;
            message: {
                id: string;
                channelId: string;
                memberId: string;
                content: string;
                type: import("../entities/message.entity").MessageType;
                threadId: string | null;
                isEdited: boolean;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
            };
        };
    } | {
        event: string;
        data: {
            message: any;
            success?: undefined;
        };
    }>;
    handleTyping(client: AuthenticatedSocket, data: {
        channelId: string;
        isTyping: boolean;
    }): void;
    emitToUser(userId: string, event: string, data: any): void;
    emitToWorkspace(workspaceId: string, event: string, data: any): void;
    emitToChannel(channelId: string, event: string, data: any): void;
    joinUserToWorkspace(userId: string, workspaceId: string): Promise<void>;
}
