import { WorkspacesService } from '../services/workspace.service';
import { CreateWorkspaceDto } from '../dtos/workspace.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { Workspace } from '../entities/workspace.entity';
import { GetUserWorkspaceResponse, GetUserWorkspacesResponse } from '../interfaces/workspace.interface';
export declare class WorkspacesController {
    private readonly workspaceService;
    constructor(workspaceService: WorkspacesService);
    create(createDto: CreateWorkspaceDto, req: AuthenticatedRequest): Promise<{
        workspace: Workspace | null;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getUserWorkspaces(req: AuthenticatedRequest): Promise<GetUserWorkspacesResponse>;
    getById(id: string, req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse>;
    getWorkspaceMembers(workspaceId: string, req: AuthenticatedRequest, limit?: string, offset?: string, role?: string, isActive?: string): Promise<{
        members: {
            member: {
                id: string;
                userId: string;
                role: string;
                isActive: boolean;
                joinedAt: Date;
            };
            user: {
                id: string;
                email: string;
                fullName: string;
                avatarUrl: string | null;
                isEmailVerified: boolean;
            };
        }[];
        total: number;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
}
