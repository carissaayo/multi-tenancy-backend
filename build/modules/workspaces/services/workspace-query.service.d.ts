import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { GetUserWorkspacesResponse } from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
export declare class WorkspaceQueryService {
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly dataSource;
    private readonly tokenManager;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, dataSource: DataSource, tokenManager: TokenManager);
    findById(id: string): Promise<Workspace>;
    findBySlug(slug: string): Promise<Workspace | null>;
    getUserWorkspaces(req: AuthenticatedRequest): Promise<GetUserWorkspacesResponse>;
    findWorkspaceWithSafeFields(identifier: string, bySlug?: boolean): Promise<Workspace | null>;
    getMultipleWorkspacesWithSafeFields(identifiers: string[], bySlug?: boolean): Promise<Workspace[]>;
    isValidSlug(slug: string): Promise<boolean>;
    sanitizeSlugForSQL(slug: string): string;
    getWorkspaceStats(workspaceId: string): Promise<{
        memberCount: number;
        channelCount: number;
        messageCount: number;
        fileCount: number;
        storageUsed: number;
    }>;
}
