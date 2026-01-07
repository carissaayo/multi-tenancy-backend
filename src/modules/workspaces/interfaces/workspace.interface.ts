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

export interface GetUserWorkspaceResponse {
  workspace: Workspace | null;
  accessToken: string;
  refreshToken: string;
  message: string;
}