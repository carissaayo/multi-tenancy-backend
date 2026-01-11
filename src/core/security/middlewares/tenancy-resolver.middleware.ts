import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { publicRoutes } from '../constants/public-routes';
import { AuthenticatedRequest } from '../interfaces/custom-request.interface';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (this.isPublicRoute(req.originalUrl)) {
        this.logger.debug(
          `Skipping tenant resolution for public route: ${req.originalUrl}`,
        );
        return next();
      }

      // Skip tenant resolution for workspace-agnostic routes (e.g., creating workspace, listing user workspaces)
      if (this.isWorkspaceOptionalRoute(req.originalUrl)) {
        this.logger.debug(
          `Workspace optional route: ${req.originalUrl} - attempting to resolve workspace if subdomain present`,
        );

        // Try to resolve workspace if subdomain exists, but don't fail if it doesn't
        const workspaceSlug = this.extractWorkspaceFromSubdomain(req.hostname);
        if (workspaceSlug) {
          const workspace = await this.workspaceRepo.findOne({
            where: { slug: workspaceSlug, isActive: true },
          });
          if (workspace) {
            req.workspace = workspace;
            req.workspaceId = workspace.id;
            this.logger.debug(
              `Workspace resolved for optional route: ${workspace.slug}`,
            );
          }
        }
        return next();
      }

      // For workspace-scoped routes, workspace from subdomain is REQUIRED
      const workspaceSlug = this.extractWorkspaceFromSubdomain(req.hostname);

      if (!workspaceSlug) {
        this.logger.warn(
          `No workspace subdomain found in hostname: ${req.hostname}`,
        );
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message:
            'Workspace subdomain is required. Please access this resource through your workspace subdomain (e.g., workspace.app.com)',
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

  private isPublicRoute(path: string): boolean {
    return publicRoutes.some((route) => {
      const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
      return regex.test(path);
    });
  }

  private isWorkspaceOptionalRoute(path: string): boolean {
    // Routes that don't require workspace subdomain
    // These are workspace-agnostic operations
    const workspaceOptionalRoutes = [
      '/api/workspaces', // POST (create), GET (list user workspaces)
    ];

    return workspaceOptionalRoutes.some((route) => {
      // Match exact route or routes that start with it (excluding routes with :id)
      if (path === route || path === `${route}/`) {
        return true;
      }
      // Don't match routes with IDs like /api/workspaces/:id/...
      const pathWithoutQuery = path.split('?')[0];
      return (
        pathWithoutQuery.startsWith(`${route}/`) &&
        !pathWithoutQuery.match(/\/[^\/]+\//)
      ); // No additional path segments
    });
  }
}
