import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
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
        const workspaceSlug = this.extractWorkspaceFromSubdomain(req);
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
      const workspaceSlug = this.extractWorkspaceFromSubdomain(req);

      if (!workspaceSlug) {
        this.logger.warn(
          `No workspace subdomain found in hostname: ${this.getHostname(req)}`,
        );
        throw customError.badRequest(
          'Workspace subdomain is required. Please access this resource through your workspace subdomain (e.g., workspace.app.com)',
        );
      }

      const allowsDeactivated = this.allowsDeactivatedWorkspace(
        req.originalUrl,
      );

      // Lookup workspace - conditionally filter by isActive
      const workspace = await this.workspaceRepo.findOne({
        where: allowsDeactivated
          ? { slug: workspaceSlug }
          : { slug: workspaceSlug, isActive: true },
      });

      if (!workspace) {
        // Check if workspace exists but is inactive (for better error message)
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

      // Attach workspace to request
      req.workspace = workspace;
      req.workspaceId = workspace.id;

      this.logger.debug(
        `Resolved workspace: ${workspace.slug} (${workspace.id})${allowsDeactivated && !workspace.isActive ? ' [deactivated allowed]' : ''}`,
      );
      next();
    } catch (error) {
      // Re-throw custom errors so they can be handled by the global exception filter
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      // For unexpected errors, log and throw internal server error
      this.logger.error('Tenant resolution failed:', error);
      throw customError.internalServerError('Failed to resolve workspace');
    }
  }

  private getHostname(req: AuthenticatedRequest): string {
    // Use X-Forwarded-Host if available (when behind proxy like Render)
    return (req.headers['x-forwarded-host'] as string) || req.hostname;
  }

  private extractWorkspaceFromSubdomain(
    req: AuthenticatedRequest,
  ): string | null {
    const hostname = this.getHostname(req);
    const parts = hostname.split('.');

    // Handle localhost subdomains first (e.g., backend-developers.localhost)
    if (hostname.includes('localhost')) {
      // For local dev, check if there's a subdomain before localhost
      if (parts.length > 1 && parts[0] !== 'localhost') {
        return parts[0]; // Return the subdomain (e.g., 'backend-developers')
      }
      return null; // Just 'localhost' with no subdomain
    }

    // Known base domains that should not be treated as workspace subdomains
    // Add your production domain here (e.g., 'yourdomain.com', 'onrender.com')
    const baseDomains = [
      'onrender.com',
      // Remove 'localhost' from here since we handle it above
      // Add your custom domain here if you have one
      // 'yourdomain.com',
    ];

    // Check if hostname ends with a known base domain
    const isBaseDomain = baseDomains.some(
      (baseDomain) =>
        hostname === baseDomain || hostname.endsWith('.' + baseDomain),
    );

    // If it's a base domain (no subdomain), return null
    if (isBaseDomain && parts.length <= 2) {
      return null;
    }

    // Extract first part as workspace slug only if it's not a known base domain
    // For example: workspace.onrender.com -> workspace
    // But: your-app.onrender.com -> null (no workspace)
    if (isBaseDomain) {
      // If it's a base domain, check if there's a subdomain
      // workspace.onrender.com -> workspace
      // your-app.onrender.com -> null (this is the app itself, not a workspace)
      const subdomain = parts[0];
      // You might want to add logic here to distinguish between app name and workspace
      // For now, we'll allow it and let the database lookup fail if it's not a workspace
      return subdomain;
    }

    // Extract first part as workspace slug
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
      // Convert route pattern to regex (e.g., '/api/workspaces/:id' -> '/api/workspaces/[^/]+')
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp('^' + routePattern + '/?$');

      // Check if path matches the route pattern
      return regex.test(pathWithoutQuery);
    });
  }

  private allowsDeactivatedWorkspace(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];

    return allowDeactivatedWorkspaceRoutes.some((route) => {
      // Convert route pattern to regex (e.g., '/api/settings/activate' -> '/api/settings/activate')
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp('^' + routePattern + '/?$');

      // Check if path matches the route pattern
      return regex.test(pathWithoutQuery);
    });
  }
}
