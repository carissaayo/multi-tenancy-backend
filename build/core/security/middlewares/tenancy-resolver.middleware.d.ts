import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { AuthenticatedRequest } from '../interfaces/custom-request.interface';
export declare class TenantResolverMiddleware implements NestMiddleware {
    private readonly workspaceRepo;
    private readonly logger;
    constructor(workspaceRepo: Repository<Workspace>);
    use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    private getHostname;
    private extractWorkspaceFromSubdomain;
    private isPublicRoute;
    private isWorkspaceOptionalRoute;
    private allowsDeactivatedWorkspace;
}
