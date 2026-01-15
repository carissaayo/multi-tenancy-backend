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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workspace_dto_1 = require("../dtos/workspace.dto");
const workspace_interface_1 = require("../interfaces/workspace.interface");
const platform_express_1 = require("@nestjs/platform-express");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_setting_service_1 = require("../services/workspace-setting.service");
let WorkspaceSettingsController = class WorkspaceSettingsController {
    workspaceSettingService;
    constructor(workspaceSettingService) {
        this.workspaceSettingService = workspaceSettingService;
    }
    getById(req) {
        return this.workspaceSettingService.getUserSingleWorkspace(req);
    }
    update(updateDto, req) {
        return this.workspaceSettingService.updateWorkspaceProperties(req, updateDto);
    }
    updateLogo(file, req) {
        if (!file) {
            throw custom_errors_1.customError.badRequest('No file provided');
        }
        return this.workspaceSettingService.updateWorkspaceLogo(req, file);
    }
    deactivate(req) {
        return this.workspaceSettingService.deactivate(req);
    }
    activate(req) {
        return this.workspaceSettingService.activate(req);
    }
    delete(req) {
        return this.workspaceSettingService.delete(req);
    }
    updatePlan(newPlan, req) {
        return this.workspaceSettingService.updatePlan(req, newPlan);
    }
    getStats(req) {
        return this.workspaceSettingService.getWorkspaceStats(req);
    }
};
exports.WorkspaceSettingsController = WorkspaceSettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace by ID (with membership check)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace details' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace properties excluding slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace updated successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workspace_dto_1.UpdateWorkspaceDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('/logo'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload workspace logo' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workspace logo updated successfully',
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "updateLogo", null);
__decorate([
    (0, common_1.Patch)('deactivate'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate (soft delete) a workspace' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workspace deactivated successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)('activate'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a workspace' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workspace activated successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "activate", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace deleted successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)('plan'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace plan (upgrade/downgrade)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace plan updated' }),
    __param(0, (0, common_1.Query)('plan')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceSettingsController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace stats' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceSettingsController.prototype, "getStats", null);
exports.WorkspaceSettingsController = WorkspaceSettingsController = __decorate([
    (0, swagger_1.ApiTags)('Workspace Settings'),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [workspace_setting_service_1.WorkspaceSettingService])
], WorkspaceSettingsController);
//# sourceMappingURL=workspace-settings.controller.js.map