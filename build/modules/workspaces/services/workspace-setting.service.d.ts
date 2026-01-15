import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { GetUserWorkspaceResponse, WorkspacePlan, UpdateWorkspaceResponse, NoDataWorkspaceResponse } from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';
export declare class WorkspaceSettingService {
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly workspaceQueryService;
    private readonly workspaceMembershipService;
    private readonly workspaceLifecycleService;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, workspaceQueryService: WorkspaceQueryService, workspaceMembershipService: WorkspaceMembershipService, workspaceLifecycleService: WorkspaceLifecycleService);
    getUserSingleWorkspace(req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse>;
    updateWorkspaceProperties(req: AuthenticatedRequest, updateDto: UpdateWorkspaceDto): Promise<UpdateWorkspaceResponse>;
    updateWorkspaceLogo(req: AuthenticatedRequest, file: Express.Multer.File): Promise<UpdateWorkspaceResponse>;
    deactivate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    activate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    delete(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    updatePlan(req: AuthenticatedRequest, newPlan: WorkspacePlan): Promise<Workspace>;
    private validatePlanDowngrade;
    getWorkspaceStats(req: AuthenticatedRequest): Promise<{
        memberCount: number;
        channelCount: number;
        messageCount: number;
        fileCount: number;
        storageUsed: number;
    }>;
}
