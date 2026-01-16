import { Socket } from 'socket.io';

// Use type intersection to ensure all Socket methods are available
export type AuthenticatedSocket = Socket & {
  userId: string;
  workspaceId?: string;
};
