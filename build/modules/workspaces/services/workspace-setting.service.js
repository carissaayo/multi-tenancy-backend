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
var WorkspaceSettingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSettingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("../entities/workspace.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_query_service_1 = require("./workspace-query.service");
const workspace_membership_service_1 = require("./workspace-membership.service");
const workspace_lifecycle_service_1 = require("./workspace-lifecycle.service");
let WorkspaceSettingService = WorkspaceSettingService_1 = class WorkspaceSettingService {
    workspaceRepo;
    userRepo;
    workspaceQueryService;
    workspaceMembershipService;
    workspaceLifecycleService;
    logger = new common_1.Logger(WorkspaceSettingService_1.name);
    constructor(workspaceRepo, userRepo, workspaceQueryService, workspaceMembershipService, workspaceLifecycleService) {
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.workspaceQueryService = workspaceQueryService;
        this.workspaceMembershipService = workspaceMembershipService;
        this.workspaceLifecycleService = workspaceLifecycleService;
    }
    async getUserSingleWorkspace(req) {
        return this.workspaceMembershipService.getUserSingleWorkspace(req.workspaceId, req);
    }
    async updateWorkspaceProperties(req, updateDto) {
        return this.workspaceLifecycleService.updateWorkspaceProperties(req.workspaceId, req, updateDto);
    }
    async updateWorkspaceLogo(req, file) {
        return this.workspaceLifecycleService.updateWorkspaceLogo(req.workspaceId, req, file);
    }
    async deactivate(req) {
        return this.workspaceLifecycleService.deactivate(req);
    }
    async activate(req) {
        return this.workspaceLifecycleService.activate(req);
    }
    async delete(req) {
        return this.workspaceLifecycleService.delete(req);
    }
    async updatePlan(req, newPlan) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        const workspace = await this.workspaceQueryService.findById(req.workspaceId);
        if (workspace.createdBy !== user.id) {
            throw custom_errors_1.customError.forbidden('Only workspace owner can change plan');
        }
        if (newPlan === 'free' && workspace.plan !== 'free') {
            await this.validatePlanDowngrade(workspace);
        }
        workspace.plan = newPlan;
        workspace.updatedAt = new Date();
        await this.workspaceRepo.save(workspace);
        this.logger.log(`Workspace plan updated: ${workspace.slug} → ${newPlan}`);
        return workspace;
    }
    async validatePlanDowngrade(workspace) {
        const stats = await this.workspaceQueryService.getWorkspaceStats(workspace.id);
        const freeLimits = {
            maxMembers: 10,
            maxStorageMB: 5 * 1024,
        };
        if (stats.memberCount > freeLimits.maxMembers) {
            throw custom_errors_1.customError.badRequest(`Cannot downgrade: Free plan allows max ${freeLimits.maxMembers} members`);
        }
        if (stats.storageUsed > freeLimits.maxStorageMB) {
            throw custom_errors_1.customError.badRequest(`Cannot downgrade: Storage exceeds free plan limit`);
        }
    }
    async getWorkspaceStats(req) {
        return this.workspaceQueryService.getWorkspaceStats(req.workspaceId);
    }
};
exports.WorkspaceSettingService = WorkspaceSettingService;
exports.WorkspaceSettingService = WorkspaceSettingService = WorkspaceSettingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        workspace_query_service_1.WorkspaceQueryService,
        workspace_membership_service_1.WorkspaceMembershipService,
        workspace_lifecycle_service_1.WorkspaceLifecycleService])
], WorkspaceSettingService);
//# sourceMappingURL=workspace-setting.service.js.map