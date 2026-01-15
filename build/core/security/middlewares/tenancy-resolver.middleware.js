"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TenantResolverMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantResolverMiddleware = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("../../../modules/workspaces/entities/workspace.entity");
const public_routes_1 = require("../constants/public-routes");
const public_routes_2 = require("../constants/public-routes");
let TenantResolverMiddleware = TenantResolverMiddleware_1 = class TenantResolverMiddleware {
    workspaceRepo;
    logger = new common_1.Logger(TenantResolverMiddleware_1.name);
    constructor(workspaceRepo) {
        this.workspaceRepo = workspaceRepo;
    }
    async use(req, res, next) {
        try {
            if (this.isPublicRoute(req.originalUrl)) {
                this.logger.debug(`Skipping tenant resolution for public route: ${req.originalUrl}`);
                return next();
            }
            if (this.isWorkspaceOptionalRoute(req.originalUrl)) {
                this.logger.debug(`Workspace optional route: ${req.originalUrl} - attempting to resolve workspace if subdomain present`);
                const workspaceSlug = this.extractWorkspaceFromSubdomain(req.hostname);
                if (workspaceSlug) {
                    const workspace = await this.workspaceRepo.findOne({
                        where: { slug: workspaceSlug, isActive: true },
                    });
                    if (workspace) {
                        req.workspace = workspace;
                        req.workspaceId = workspace.id;
                        this.logger.debug(`Workspace resolved for optional route: ${workspace.slug}`);
                    }
                }
                return next();
            }
            const workspaceSlug = this.extractWorkspaceFromSubdomain(req.hostname);
            if (!workspaceSlug) {
                this.logger.warn(`No workspace subdomain found in hostname: ${req.hostname}`);
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Workspace subdomain is required. Please access this resource through your workspace subdomain (e.g., workspace.app.com)',
                });
            }
            const allowsDeactivated = this.allowsDeactivatedWorkspace(req.originalUrl);
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
                        this.logger.warn(`Workspace ${workspaceSlug} is deactivated`);
                        return res.status(common_1.HttpStatus.FORBIDDEN).json({
                            success: false,
                            message: 'Workspace is deactivated',
                        });
                    }
                }
                this.logger.warn(`Workspace not found: ${workspaceSlug}`);
                return res.status(common_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: 'Workspace not found',
                });
            }
            req.workspace = workspace;
            req.workspaceId = workspace.id;
            this.logger.debug(`Resolved workspace: ${workspace.slug} (${workspace.id})${allowsDeactivated && !workspace.isActive ? ' [deactivated allowed]' : ''}`);
            next();
        }
        catch (error) {
            this.logger.error('Tenant resolution failed:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to resolve workspace',
            });
        }
    }
    extractWorkspaceFromSubdomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length === 1 || hostname.includes('localhost')) {
            if (parts.length > 1 && parts[0] !== 'localhost') {
                return parts[0];
            }
            return null;
        }
        return parts[0];
    }
    isPublicRoute(path) {
        const pathWithoutQuery = path.split('?')[0];
        return public_routes_1.publicRoutes.some((route) => {
            const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '/?$');
            return regex.test(pathWithoutQuery);
        });
    }
    isWorkspaceOptionalRoute(path) {
        const pathWithoutQuery = path.split('?')[0];
        return public_routes_2.workspaceOptionalRoutes.some((route) => {
            const routePattern = route.replace(/:[^/]+/g, '[^/]+');
            const regex = new RegExp('^' + routePattern + '/?$');
            return regex.test(pathWithoutQuery);
        });
    }
    allowsDeactivatedWorkspace(path) {
        const pathWithoutQuery = path.split('?')[0];
        return public_routes_1.allowDeactivatedWorkspaceRoutes.some((route) => {
            const routePattern = route.replace(/:[^/]+/g, '[^/]+');
            const regex = new RegExp('^' + routePattern + '/?$');
            return regex.test(pathWithoutQuery);
        });
    }
};
exports.TenantResolverMiddleware = TenantResolverMiddleware;
exports.TenantResolverMiddleware = TenantResolverMiddleware = TenantResolverMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TenantResolverMiddleware);
//# sourceMappingURL=tenancy-resolver.middleware.js.map