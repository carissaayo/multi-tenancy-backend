import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import {
  allowDeactivatedWorkspaceRoutes,
  publicRoutes,
} from '../constants/public-routes';
import { workspaceOptionalRoutes } from '../constants/public-routes';
import { AuthenticatedRequest } from '../interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);
  private readonly WORKSPACE_HEADER = 'x-workspace-slug';

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.method === 'OPTIONS') {
        this.logger.debug(
          `Skipping tenant resolution for OPTIONS request: ${req.originalUrl}`,
        );
        return next();
      }

      if (this.isPublicRoute(req.originalUrl)) {
        this.logger.debug(
          `Skipping tenant resolution for public route: ${req.originalUrl}`,
        );
        return next();
      }

      if (this.isWorkspaceOptionalRoute(req.originalUrl)) {
        this.logger.debug(
          `Workspace optional route: ${req.originalUrl} - attempting to resolve workspace if available`,
        );

        const workspaceSlug = this.extractWorkspaceSlug(req);
        if (workspaceSlug) {
          const workspace = await this.workspaceRepo.findOne({
            where: { slug: workspaceSlug, isActive: true },
          });
          if (workspace) {
            req.workspace = workspace;
            req.workspaceId = workspace.id;
            this.logger.debug(
              `Workspace resolved for optional route: ${workspace.slug} (source: ${this.getWorkspaceSource(req)})`,
            );
          }
        }
        return next();
      }

      const workspaceSlug = this.extractWorkspaceSlug(req);

      if (!workspaceSlug) {
        this.logger.warn(
          `No workspace identifier found. Hostname: ${this.getHostname(req)}, Header: ${req.headers[this.WORKSPACE_HEADER] || 'not set'}`,
        );
        throw customError.badRequest(
          'Workspace identifier is required. Please provide the workspace slug via the x-workspace-slug header or use a workspace subdomain (e.g., workspace.app.com)',
        );
      }

      const allowsDeactivated = this.allowsDeactivatedWorkspace(
        req.originalUrl,
      );

      const workspace = await this.workspaceRepo.findOne({
        where: allowsDeactivated
          ? { slug: workspaceSlug }
          : { slug: workspaceSlug, isActive: true },
      });

      if (!workspace) {
        if (!allowsDeactivated) {
          const inactiveWorkspace = await this.workspaceRepo.findOne({
            where: { slug: workspaceSlug, isActive: false },
          });
          if (inactiveWorkspace) {
            this.logger.warn(`Workspace ${workspaceSlug} is deactivated - action not allowed`);
            throw customError.forbidden(
              'You can not perform this action on a deactivated workspace',
            );
          }
        }

        this.logger.warn(`Workspace not found: ${workspaceSlug}`);
        throw customError.notFound('Workspace not found');
      }

      req.workspace = workspace;
      req.workspaceId = workspace.id;

      this.logger.debug(
        `Resolved workspace: ${workspace.slug} (${workspace.id}) via ${this.getWorkspaceSource(req)}${allowsDeactivated && !workspace.isActive ? ' [deactivated allowed]' : ''}`,
      );
      next();
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      this.logger.error('Tenant resolution failed:', error);
      throw customError.internalServerError('Failed to resolve workspace');
    }
  }

  private getHostname(req: AuthenticatedRequest): string {
    return (req.headers['x-forwarded-host'] as string) || req.hostname;
  }

  /**
   * Extract workspace slug from request.
   * Priority: 1. Header (x-workspace-slug) 2. Subdomain
   * 
   * Header-based resolution is useful when:
   * - Running on platforms without wildcard SSL (e.g., Render free tier)
   * - Testing locally without subdomain setup
   * 
   * Subdomain-based resolution is preferred when:
   * - Using a custom domain with wildcard SSL certificate
   * - Production environment with proper DNS setup
   */
  private extractWorkspaceSlug(req: AuthenticatedRequest): string | null {
    const headerSlug = this.extractWorkspaceFromHeader(req);
    if (headerSlug) {
      this.logger.debug(`Workspace slug from header: ${headerSlug}`);
      return headerSlug;
    }

    const subdomainSlug = this.extractWorkspaceFromSubdomain(req);
    if (subdomainSlug) {
      this.logger.debug(`Workspace slug from subdomain: ${subdomainSlug}`);
      return subdomainSlug;
    }

    return null;
  }

  /**
   * Extract workspace slug from x-workspace-slug header
   */
  private extractWorkspaceFromHeader(req: AuthenticatedRequest): string | null {
    const headerValue = req.headers[this.WORKSPACE_HEADER];
    if (headerValue && typeof headerValue === 'string') {
      const slug = headerValue.trim().toLowerCase();
      if (slug.length > 0) {
        return slug;
      }
    }
    return null;
  }

  /**
   * Get the source of workspace resolution (for logging/debugging)
   */
  private getWorkspaceSource(req: AuthenticatedRequest): string {
    if (this.extractWorkspaceFromHeader(req)) {
      return 'header';
    }
    if (this.extractWorkspaceFromSubdomain(req)) {
      return 'subdomain';
    }
    return 'none';
  }

  /**
   * Extract workspace slug from subdomain.
   * Used when wildcard SSL is available (custom domain setup).
   */
  private extractWorkspaceFromSubdomain(
    req: AuthenticatedRequest,
  ): string | null {
    const hostname = this.getHostname(req);
    const parts = hostname.split('.');

    if (hostname.includes('localhost')) {
      if (parts.length > 1 && parts[0] !== 'localhost') {
        return parts[0];
      }
      return null;
    }

    const baseDomains = ['onrender.com'];

    const isBaseDomain = baseDomains.some(
      (baseDomain) =>
        hostname === baseDomain || hostname.endsWith('.' + baseDomain),
    );

    if (isBaseDomain && parts.length <= 2) {
      return null;
    }

    if (isBaseDomain) {
      return parts[0];
    }

    return parts[0];
  }

  private isPublicRoute(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];

    return publicRoutes.some((route) => {
      const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '/?$');
      return regex.test(pathWithoutQuery);
    });
  }

  private isWorkspaceOptionalRoute(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];

    return workspaceOptionalRoutes.some((route) => {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp('^' + routePattern + '/?$');
      return regex.test(pathWithoutQuery);
    });
  }

  private allowsDeactivatedWorkspace(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];

    return allowDeactivatedWorkspaceRoutes.some((route) => {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp('^' + routePattern + '/?$');
      return regex.test(pathWithoutQuery);
    });
  }
}
