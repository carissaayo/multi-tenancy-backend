import { Repository, DataSource } from 'typeorm';
import { WorkspaceQueryService } from './workspace-query.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { Workspace } from '../entities/workspace.entity';
import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { GetUserWorkspaceResponse } from '../interfaces/workspace.interface';
export declare class WorkspaceMembershipService {
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly dataSource;
    private readonly workspaceQueryService;
    private readonly memberService;
    private readonly tokenManager;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, dataSource: DataSource, workspaceQueryService: WorkspaceQueryService, memberService: MemberService, tokenManager: TokenManager);
    canUserManageWorkspace(workspaceId: string, userId: string): Promise<boolean>;
    countUserWorkspaces(userId: string): Promise<number>;
    getUserSingleWorkspace(workspaceId: string, req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse>;
    countUserFreeWorkspaces(userId: string): Promise<number>;
    getMaxWorkspacesForUser(user: User): number;
    getMemberProfile(member: WorkspaceMember): Partial<WorkspaceMember>;
    getWorkspaceMembers(workspaceId: string, userId: string, options?: {
        limit?: number;
        offset?: number;
        role?: string;
        isActive?: boolean;
    }): Promise<{
        members: Array<{
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
        }>;
        total: number;
    }>;
}
