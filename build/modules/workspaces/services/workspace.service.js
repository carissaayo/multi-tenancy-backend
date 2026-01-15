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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const workspace_query_service_1 = require("./workspace-query.service");
const workspace_membership_service_1 = require("./workspace-membership.service");
const workspace_lifecycle_service_1 = require("./workspace-lifecycle.service");
let WorkspacesService = class WorkspacesService {
    workspaceQueryService;
    workspaceMembershipService;
    workspaceLifecycleService;
    constructor(workspaceQueryService, workspaceMembershipService, workspaceLifecycleService) {
        this.workspaceQueryService = workspaceQueryService;
        this.workspaceMembershipService = workspaceMembershipService;
        this.workspaceLifecycleService = workspaceLifecycleService;
    }
    async create(req, createDto) {
        return this.workspaceLifecycleService.create(req, createDto);
    }
    async getUserWorkspaces(req) {
        return this.workspaceQueryService.getUserWorkspaces(req);
    }
    async getUserSingleWorkspace(workspaceId, req) {
        return this.workspaceMembershipService.getUserSingleWorkspace(workspaceId, req);
    }
    async findBySlug(slug) {
        return this.workspaceQueryService.findBySlug(slug);
    }
    async findById(id) {
        return this.workspaceQueryService.findById(id);
    }
    async findWorkspaceWithSafeFields(identifier, bySlug = false) {
        return this.workspaceQueryService.findWorkspaceWithSafeFields(identifier, bySlug);
    }
    async canUserManageWorkspace(workspaceId, userId) {
        return this.workspaceMembershipService.canUserManageWorkspace(workspaceId, userId);
    }
    sanitizeSlugForSQL(slug) {
        return this.workspaceQueryService.sanitizeSlugForSQL(slug);
    }
    async countUserFreeWorkspaces(userId) {
        return this.workspaceMembershipService.countUserFreeWorkspaces(userId);
    }
    normalizedWorkspaceData(workspace) {
        return {
            id: workspace.id,
            slug: workspace.slug,
            name: workspace.name,
            description: workspace.description,
            logoUrl: workspace.logoUrl,
            plan: workspace.plan,
            isActive: workspace.isActive,
            settings: workspace.settings,
            createdBy: workspace.createdBy,
            creator: workspace.creator
                ? {
                    fullName: workspace.creator.fullName,
                    avatarUrl: workspace.creator.avatarUrl,
                }
                : null,
            ownerId: workspace.ownerId,
            owner: workspace.owner
                ? {
                    fullName: workspace.owner.fullName,
                    avatarUrl: workspace.owner.avatarUrl,
                }
                : null,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        };
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [workspace_query_service_1.WorkspaceQueryService,
        workspace_membership_service_1.WorkspaceMembershipService,
        workspace_lifecycle_service_1.WorkspaceLifecycleService])
], WorkspacesService);
//# sourceMappingURL=workspace.service.js.map