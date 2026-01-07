import { Workspace } from '../entities/workspace.entity';
export enum WorkspacePlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}


export interface GetUserWorkspacesResponse {
  workspaces: Workspace[];
  accessToken: string;
  refreshToken: string;
  message: string;
  totalWorkspacesCount: number;
}