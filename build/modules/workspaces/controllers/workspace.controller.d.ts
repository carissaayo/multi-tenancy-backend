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
}
