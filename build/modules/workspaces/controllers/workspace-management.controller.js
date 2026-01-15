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
exports.WorkspaceManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workspace_management_service_1 = require("../services/workspace-management.service");
const workspace_management_dto_1 = require("../dtos/workspace-management.dto");
let WorkspaceManagementController = class WorkspaceManagementController {
    workspaceManagementService;
    constructor(workspaceManagementService) {
        this.workspaceManagementService = workspaceManagementService;
    }
    updateMemberRole(req, changeMemberRoleDto) {
        return this.workspaceManagementService.changeMemberRole(changeMemberRoleDto, req);
    }
    removeUserFromWorkspace(req, removeUserFromWorkspaceDto) {
        return this.workspaceManagementService.removeUserFromWorkspace(removeUserFromWorkspaceDto, req);
    }
    leaveWorkspace(req) {
        return this.workspaceManagementService.leaveWorkspace(req);
    }
    deactivateMember(req, deactivateMemberDto) {
        return this.workspaceManagementService.deactivateMember(req, deactivateMemberDto);
    }
    transferOwnership(req, transferOwnershipDto) {
        return this.workspaceManagementService.transferOwnership(req, transferOwnershipDto);
    }
};
exports.WorkspaceManagementController = WorkspaceManagementController;
__decorate([
    (0, common_1.Patch)('members/role'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update member role' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Member role has been updated successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workspace_management_dto_1.ChangeMemberRoleDto]),
    __metadata("design:returntype", void 0)
], WorkspaceManagementController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)('members/remove'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove user from workspace' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User has been removed from workspace successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workspace_management_dto_1.RemoveUserFromWorkspaceDto]),
    __metadata("design:returntype", void 0)
], WorkspaceManagementController.prototype, "removeUserFromWorkspace", null);
__decorate([
    (0, common_1.Patch)('leave'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave workspace' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'You have left the workspace successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceManagementController.prototype, "leaveWorkspace", null);
__decorate([
    (0, common_1.Patch)('members/deactivate'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate member' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member has been deactivated successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workspace_management_dto_1.DeactivateMemberDto]),
    __metadata("design:returntype", void 0)
], WorkspaceManagementController.prototype, "deactivateMember", null);
__decorate([
    (0, common_1.Patch)('transfer-ownership'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Transfer ownership' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Ownership has been transferred successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workspace_management_dto_1.TransferOwnershipDto]),
    __metadata("design:returntype", void 0)
], WorkspaceManagementController.prototype, "transferOwnership", null);
exports.WorkspaceManagementController = WorkspaceManagementController = __decorate([
    (0, swagger_1.ApiTags)('Workspace Management'),
    (0, common_1.Controller)('management'),
    __metadata("design:paramtypes", [workspace_management_service_1.WorkspaceManagementService])
], WorkspaceManagementController);
//# sourceMappingURL=workspace-management.controller.js.map