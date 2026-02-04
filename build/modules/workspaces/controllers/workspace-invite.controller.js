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
exports.WorkspaceInviteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workspace_invite_service_1 = require("../services/workspace-invite.service");
const workspace_invite_dto_1 = require("../dtos/workspace-invite.dto");
let WorkspaceInviteController = class WorkspaceInviteController {
    workspaceService;
    constructor(workspaceService) {
        this.workspaceService = workspaceService;
    }
    getMyInvitations(req) {
        return this.workspaceService.getMyInvitations(req);
    }
    getInvitations(req) {
        return this.workspaceService.listWorkspaceInvites(req);
    }
    sendInvitation(req, inviteDto) {
        return this.workspaceService.inviteByEmail(req, inviteDto);
    }
    revokeInvitation(req, inviteId) {
        return this.workspaceService.revokeInvite(inviteId, req);
    }
    acceptInvitation(token) {
        return this.workspaceService.acceptInvitation(token);
    }
};
exports.WorkspaceInviteController = WorkspaceInviteController;
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pending invitations for current user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User invitations retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceInviteController.prototype, "getMyInvitations", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workspace invitations' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workspace invitations retrieved successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceInviteController.prototype, "getInvitations", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Send workspace invitation' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Workspace invitation sent successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workspace_invite_dto_1.WorkspaceInviteDto]),
    __metadata("design:returntype", void 0)
], WorkspaceInviteController.prototype, "sendInvitation", null);
__decorate([
    (0, common_1.Patch)('revoke/:inviteId'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke workspace invitation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workspace invitation revoked successfully',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('inviteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkspaceInviteController.prototype, "revokeInvitation", null);
__decorate([
    (0, common_1.Patch)('accept'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Send workspace invitation' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Workspace invitation sent successfully',
    }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkspaceInviteController.prototype, "acceptInvitation", null);
exports.WorkspaceInviteController = WorkspaceInviteController = __decorate([
    (0, swagger_1.ApiTags)('Workspace Invitations'),
    (0, common_1.Controller)('invitations'),
    __metadata("design:paramtypes", [workspace_invite_service_1.WorkspaceInviteService])
], WorkspaceInviteController);
//# sourceMappingURL=workspace-invite.controller.js.map