import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { publicRoutes } from '../constants/public-routes';
import { AuthenticatedRequest } from '../interfaces/custom-request.interface';

interface RequestWithTenant extends Request {
  workspace?: Workspace;
  workspaceId?: string;
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Skip tenant resolution for global routes
      if (this.isPublicRoute(req.originalUrl)) {
        this.logger.debug(
          `Skipping tenant resolution for global route: ${req.originalUrl}`,
        );
        return next();
      }

      // Extract workspace from subdomain
      const workspaceSlug = this.extractWorkspaceFromSubdomain(req.hostname);

      if (!workspaceSlug) {
        this.logger.warn(`No workspace found in hostname: ${req.hostname}`);
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid workspace',
        });
      }

      // Lookup workspace
      const workspace = await this.workspaceRepo.findOne({
        where: { slug: workspaceSlug, isActive: true },
      });

      if (!workspace) {
        this.logger.warn(`Workspace not found: ${workspaceSlug}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Workspace not found',
        });
      }

      // Attach workspace to request
      req.workspace = workspace;
      req.workspaceId = workspace.id;

      this.logger.debug(
        `Resolved workspace: ${workspace.slug} (${workspace.id})`,
      );
      next();
    } catch (error) {
      this.logger.error('Tenant resolution failed:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to resolve workspace',
      });
    }
  }

  private extractWorkspaceFromSubdomain(hostname: string): string | null {
    // Examples:
    // acme.app.com → acme
    // acme.localhost:3000 → acme
    // localhost → null (no subdomain)

    const parts = hostname.split('.');

    // localhost or IP address (no subdomain)
    if (parts.length === 1 || hostname.includes('localhost')) {
      // For local dev, check if there's a subdomain before localhost
      const localParts = hostname.split('.');
      if (localParts.length > 1 && localParts[0] !== 'localhost') {
        return localParts[0];
      }
      return null;
    }

    // Extract first part as workspace slug
    return parts[0];
  }
  isPublicRoute(path: string): boolean {
    return publicRoutes.some((route) => {
      const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(path);
    });
  }
}
