import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { UpdateWorkspaceResponse, NoDataWorkspaceResponse } from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceQueryService } from './workspace-query.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';
import { MemberService } from 'src/modules/members/services/member.service';
export declare class WorkspaceLifecycleService {
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly dataSource;
    private readonly tokenManager;
    private readonly workspaceMembershipService;
    private readonly workspaceQueryService;
    private readonly memberService;
    private readonly storageService;
    private readonly configService;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, dataSource: DataSource, tokenManager: TokenManager, workspaceMembershipService: WorkspaceMembershipService, workspaceQueryService: WorkspaceQueryService, memberService: MemberService, storageService: AWSStorageService, configService: ConfigService);
    create(req: AuthenticatedRequest, createDto: CreateWorkspaceDto): Promise<{
        workspace: Workspace | null;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    updateWorkspaceProperties(workspaceId: string, req: AuthenticatedRequest, updateDto: UpdateWorkspaceDto): Promise<UpdateWorkspaceResponse>;
    updateWorkspaceLogo(workspaceId: string, req: AuthenticatedRequest, file: Express.Multer.File): Promise<UpdateWorkspaceResponse>;
    deactivate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    activate(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    delete(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    private createWorkspaceSchema;
    private createDefaultChannels;
}
