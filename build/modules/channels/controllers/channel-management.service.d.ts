import { DataSource } from 'typeorm';
import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelManagementService {
    private readonly dataSource;
    private readonly workspaceRepo;
    private readonly workspacesService;
    private readonly memberService;
    private readonly tokenManager;
    private readonly logger;
    constructor(dataSource: DataSource, workspaceRepo: Repository<Workspace>, workspacesService: WorkspacesService, memberService: MemberService, tokenManager: TokenManager);
    joinChannel(req: AuthenticatedRequest, id: string): Promise<void>;
}
