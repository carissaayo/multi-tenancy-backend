import { DataSource, Repository } from 'typeorm';
import { WorkspaceMember } from '../entities/member.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { WorkspaceInvitationRole } from 'src/modules/workspaces/interfaces/workspace.interface';
import { User } from 'src/modules/users/entities/user.entity';
export declare class MemberService {
    private readonly dataSource;
    private readonly workspaceRepo;
    private readonly workspacesService;
    private readonly userRepo;
    private readonly logger;
    constructor(dataSource: DataSource, workspaceRepo: Repository<Workspace>, workspacesService: WorkspacesService, userRepo: Repository<User>);
    addOwnerMember(workspaceId: string, slug: string, userId: string, queryRunner: any): Promise<void>;
    isUserMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
    addMemberToWorkspace(workspaceId: string, userId: string, role: WorkspaceInvitationRole): Promise<WorkspaceMember>;
    updateMemberRole(workspaceId: string, userId: string, role: 'owner' | 'admin' | 'member' | 'guest'): Promise<WorkspaceMember>;
    removeMemberFromWorkspace(workspaceId: string, userId: string): Promise<void>;
    deactivateMember(workspaceId: string, userId: string): Promise<void>;
    transferOwnership(workspaceId: string, previousOwnerId: string, newOwnerId: string): Promise<void>;
    getMemberProfile(member: WorkspaceMember): Partial<WorkspaceMember>;
}
