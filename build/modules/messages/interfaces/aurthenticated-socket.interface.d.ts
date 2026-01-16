import { Socket } from 'socket.io';
export type AuthenticatedSocket = Socket & {
    userId: string;
    workspaceId?: string;
};
