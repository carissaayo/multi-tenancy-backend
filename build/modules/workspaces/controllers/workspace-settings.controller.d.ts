import { UpdateWorkspaceDto } from '../dtos/workspace.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { Workspace } from '../entities/workspace.entity';
import { GetUserWorkspaceResponse, NoDataWorkspaceResponse, UpdateWorkspaceResponse, WorkspacePlan } from '../interfaces/workspace.interface';
import { WorkspaceSettingService } from '../services/workspace-setting.service';
export declare class WorkspaceSettingsController {
    private readonly workspaceSettingService;
    constructor(workspaceSettingService: WorkspaceSettingService);
    getById(req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse>;
    update(updateDto: UpdateWorkspaceDto, req: AuthenticatedRequest): Promise<UpdateWorkspaceResponse>;
    updateLogo(file: Express.Multer.File, req: AuthenticatedRequest): Promise<UpdateWorkspaceResponse>;
    deactivate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    activate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    delete(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    updatePlan(newPlan: WorkspacePlan, req: AuthenticatedRequest): Promise<Workspace>;
    getStats(req: AuthenticatedRequest): Promise<{
        memberCount: number;
        channelCount: number;
        messageCount: number;
        fileCount: number;
        storageUsed: number;
    }>;
}
