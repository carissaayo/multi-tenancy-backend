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

  // Header name for workspace slug (used when subdomain routing is not available)
  private readonly WORKSPACE_HEADER = 'x-workspace-slug';

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Skip workspace validation for OPTIONS requests (CORS preflight)
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

      // Skip tenant resolution for workspace-agnostic routes (e.g., creating workspace, listing user workspaces)
      if (this.isWorkspaceOptionalRoute(req.originalUrl)) {
        this.logger.debug(
          `Workspace optional route: ${req.originalUrl} - attempting to resolve workspace if available`,
        );

        // Try to resolve workspace from header first, then subdomain
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

      // For workspace-scoped routes, workspace is REQUIRED (from header or subdomain)
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
        `Resolved workspace: ${workspace.slug} (${workspace.id}) via ${this.getWorkspaceSource(req)}${allowsDeactivated && !workspace.isActive ? ' [deactivated allowed]' : ''}`,
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
    // Try header first (for platforms without subdomain support)
    const headerSlug = this.extractWorkspaceFromHeader(req);
    if (headerSlug) {
      this.logger.debug(`Workspace slug from header: ${headerSlug}`);
      return headerSlug;
    }

    // Fall back to subdomain extraction
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
