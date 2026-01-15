import { Repository, DataSource } from 'typeorm';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceQueryService } from './workspace-query.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { MemberService } from 'src/modules/members/services/member.service';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { NoDataWorkspaceResponse } from '../interfaces/workspace.interface';
import { ChangeMemberRoleDto, DeactivateMemberDto, RemoveUserFromWorkspaceDto, TransferOwnershipDto } from '../dtos/workspace-management.dto';
export declare class WorkspaceManagementService {
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly dataSource;
    private readonly workspaceQueryService;
    private readonly workspaceMembershipService;
    private readonly memberService;
    private readonly tokenManager;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, dataSource: DataSource, workspaceQueryService: WorkspaceQueryService, workspaceMembershipService: WorkspaceMembershipService, memberService: MemberService, tokenManager: TokenManager);
    changeMemberRole(changeMemberRoleDto: ChangeMemberRoleDto, req: AuthenticatedRequest): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        member: Partial<WorkspaceMember>;
    }>;
    removeUserFromWorkspace(dto: RemoveUserFromWorkspaceDto, req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    leaveWorkspace(req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    deactivateMember(req: AuthenticatedRequest, dto: DeactivateMemberDto): Promise<NoDataWorkspaceResponse>;
    transferOwnership(req: AuthenticatedRequest, dto: TransferOwnershipDto): Promise<NoDataWorkspaceResponse>;
}
