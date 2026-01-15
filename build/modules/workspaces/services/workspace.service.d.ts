import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';
import { Workspace } from '../entities/workspace.entity';
import { CreateWorkspaceDto } from '../dtos/workspace.dto';
import { GetUserWorkspacesResponse, GetUserWorkspaceResponse } from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class WorkspacesService {
    private readonly workspaceQueryService;
    private readonly workspaceMembershipService;
    private readonly workspaceLifecycleService;
    constructor(workspaceQueryService: WorkspaceQueryService, workspaceMembershipService: WorkspaceMembershipService, workspaceLifecycleService: WorkspaceLifecycleService);
    create(req: AuthenticatedRequest, createDto: CreateWorkspaceDto): Promise<{
        workspace: Workspace | null;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getUserWorkspaces(req: AuthenticatedRequest): Promise<GetUserWorkspacesResponse>;
    getUserSingleWorkspace(workspaceId: string, req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse>;
    findBySlug(slug: string): Promise<Workspace | null>;
    findById(id: string): Promise<Workspace>;
    findWorkspaceWithSafeFields(identifier: string, bySlug?: boolean): Promise<Workspace | null>;
    canUserManageWorkspace(workspaceId: string, userId: string): Promise<boolean>;
    sanitizeSlugForSQL(slug: string): string;
    countUserFreeWorkspaces(userId: string): Promise<number>;
    normalizedWorkspaceData(workspace: Workspace): {
        id: string;
        slug: string;
        name: string;
        description: string;
        logoUrl: string;
        plan: import("../interfaces/workspace.interface").WorkspacePlan;
        isActive: boolean;
        settings: Record<string, any>;
        createdBy: string;
        creator: {
            fullName: string | null;
            avatarUrl: string | null;
        } | null;
        ownerId: string;
        owner: {
            fullName: string | null;
            avatarUrl: string | null;
        } | null;
        createdAt: Date;
        updatedAt: Date;
    };
}
