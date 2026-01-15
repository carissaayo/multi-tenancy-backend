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
var WorkspaceManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_membership_service_1 = require("./workspace-membership.service");
const workspace_query_service_1 = require("./workspace-query.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const member_service_1 = require("../../members/services/member.service");
const workspace_entity_1 = require("../entities/workspace.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const permission_interface_1 = require("../../../core/security/interfaces/permission.interface");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_interface_1 = require("../interfaces/workspace.interface");
let WorkspaceManagementService = WorkspaceManagementService_1 = class WorkspaceManagementService {
    workspaceRepo;
    userRepo;
    dataSource;
    workspaceQueryService;
    workspaceMembershipService;
    memberService;
    tokenManager;
    logger = new common_1.Logger(WorkspaceManagementService_1.name);
    constructor(workspaceRepo, userRepo, dataSource, workspaceQueryService, workspaceMembershipService, memberService, tokenManager) {
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.workspaceQueryService = workspaceQueryService;
        this.workspaceMembershipService = workspaceMembershipService;
        this.memberService = memberService;
        this.tokenManager = tokenManager;
    }
    async changeMemberRole(changeMemberRoleDto, req) {
        const { targetUserId, newRole } = changeMemberRoleDto;
        const user = req.user;
        const workspace = req.workspace;
        const requester = await this.memberService.isUserMember(workspace.id, user.id);
        if (!requester) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const targetMember = await this.memberService.isUserMember(workspace.id, targetUserId);
        if (!targetMember) {
            throw custom_errors_1.customError.notFound('Target user is not a member of this workspace');
        }
        const isRequesterOwner = workspace.ownerId === user.id || workspace.createdBy === user.id;
        const isRequesterAdmin = requester.role === 'admin' || requester.role === 'owner';
        const isTargetOwner = workspace.ownerId === targetUserId ||
            workspace.createdBy === targetUserId;
        const isTargetAdmin = targetMember.role === 'admin';
        const isTargetOwnerRole = targetMember.role === 'owner';
        if (isTargetOwner || isTargetOwnerRole) {
            throw custom_errors_1.customError.forbidden('Cannot change the role of the workspace owner');
        }
        if (user.id === targetUserId) {
            throw custom_errors_1.customError.forbidden('You cannot change your own role');
        }
        if (!Object.values(workspace_interface_1.WorkspaceInvitationRole).includes(newRole)) {
            throw custom_errors_1.customError.badRequest('Invalid role. Only admin, member, and guest roles can be changed.');
        }
        if ((newRole === workspace_interface_1.WorkspaceInvitationRole.ADMIN ||
            isTargetAdmin ||
            isTargetOwnerRole) &&
            !isRequesterOwner) {
            throw custom_errors_1.customError.forbidden('Only the workspace owner can manage admin roles');
        }
        if (!isRequesterOwner && !isRequesterAdmin) {
            throw custom_errors_1.customError.forbidden('You do not have permission to change member roles');
        }
        const rolePermissions = permission_interface_1.RolePermissions[newRole] || permission_interface_1.RolePermissions.member;
        const permissions = rolePermissions.map((p) => p.toString());
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
      UPDATE "${schemaName}".members
      SET role = $1, permissions = $2::jsonb
      WHERE user_id = $3
      RETURNING id, user_id, role, permissions, is_active, joined_at
      `, [newRole, JSON.stringify(permissions), targetUserId]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to update member role');
            }
            this.logger.log(`Member role changed: user ${targetUserId} → ${newRole} in workspace ${workspace.id} by ${user.id}`);
            const updatedMember = result[0];
            const member = {
                id: updatedMember.id,
                userId: updatedMember.user_id,
                role: updatedMember.role,
                permissions: updatedMember.permissions,
                isActive: updatedMember.is_active,
                joinedAt: updatedMember.joined_at,
            };
            const memberProfile = this.workspaceMembershipService.getMemberProfile(member);
            const tokens = await this.tokenManager.signTokens(user, req);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken || '',
                member: memberProfile,
                message: 'Member role has been updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Error changing member role in workspace ${workspace.id}: ${error.message}`);
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to change member role');
        }
    }
    async removeUserFromWorkspace(dto, req) {
        const { targetUserId } = dto;
        const user = req.user;
        const workspace = req.workspace;
        const canManageWorkspace = await this.workspaceMembershipService.canUserManageWorkspace(workspace.id, user.id);
        if (!canManageWorkspace) {
            throw custom_errors_1.customError.forbidden('You do not have permission to manage users in this workspace');
        }
        const targetMember = await this.memberService.isUserMember(workspace.id, targetUserId);
        if (!targetMember) {
            throw custom_errors_1.customError.notFound('Target user is not a member of this workspace');
        }
        const isTargetOwner = workspace.ownerId === targetUserId ||
            workspace.createdBy === targetUserId;
        if (isTargetOwner || targetMember.role === 'owner') {
            throw custom_errors_1.customError.forbidden('You cannot remove the workspace owner from the workspace');
        }
        const isRequesterOwner = workspace.ownerId === user.id || workspace.createdBy === user.id;
        if (!isRequesterOwner && targetMember.role === 'admin') {
            throw custom_errors_1.customError.forbidden('You do not have the permission to remove admins from the workspace');
        }
        await this.memberService.removeMemberFromWorkspace(workspace.id, targetUserId);
        this.logger.log(`User ${targetUserId} removed from workspace ${workspace.id} by ${user.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Member removed from workspace successfully',
        };
    }
    async leaveWorkspace(req) {
        const user = req.user;
        const workspace = req.workspace;
        const member = await this.memberService.isUserMember(workspace.id, user.id);
        if (!member) {
            throw custom_errors_1.customError.notFound('You are not a member of this workspace');
        }
        const isOwner = workspace.ownerId === user.id || workspace.createdBy === user.id;
        if (isOwner || member.role === 'owner') {
            throw custom_errors_1.customError.forbidden('Workspace owner cannot leave the workspace. Please transfer ownership or delete the workspace instead.');
        }
        await this.memberService.removeMemberFromWorkspace(workspace.id, user.id);
        this.logger.log(`User ${user.id} left workspace ${workspace.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'You have left the workspace successfully',
        };
    }
    async deactivateMember(req, dto) {
        const { targetUserId } = dto;
        const user = req.user;
        const workspace = req.workspace;
        const canManageWorkspace = await this.workspaceMembershipService.canUserManageWorkspace(workspace.id, user.id);
        if (!canManageWorkspace) {
            throw custom_errors_1.customError.forbidden('You do not have permission to manage users in this workspace');
        }
        const targetMember = await this.memberService.isUserMember(workspace.id, targetUserId);
        if (!targetMember) {
            throw custom_errors_1.customError.notFound('Target user is not a member of this workspace');
        }
        if (targetMember.role === 'owner') {
            throw custom_errors_1.customError.forbidden('You cannot deactivate the workspace owner');
        }
        await this.memberService.deactivateMember(workspace.id, targetUserId);
        this.logger.log(`User ${targetUserId} deactivated from workspace ${workspace.id} by ${user.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Member has been deactivated successfully',
        };
    }
    async transferOwnership(req, dto) {
        const { targetUserId } = dto;
        const user = req.user;
        const workspace = req.workspace;
        const isCurrentOwner = workspace.ownerId === user.id;
        if (!isCurrentOwner) {
            throw custom_errors_1.customError.forbidden('Only the workspace owner can transfer ownership');
        }
        const currentOwnerMember = await this.memberService.isUserMember(workspace.id, user.id);
        if (!currentOwnerMember) {
            throw custom_errors_1.customError.notFound('You are not a member of this workspace');
        }
        if (targetUserId === user.id) {
            throw custom_errors_1.customError.badRequest('You cannot transfer ownership to yourself');
        }
        const targetMember = await this.memberService.isUserMember(workspace.id, targetUserId);
        if (!targetMember) {
            throw custom_errors_1.customError.notFound('Target user is not a member of this workspace');
        }
        await this.memberService.transferOwnership(workspace.id, user.id, targetUserId);
        await this.workspaceRepo.update(workspace.id, {
            ownerId: targetUserId,
        });
        this.logger.log(`Ownership transferred from user ${user.id} to user ${targetUserId} in workspace ${workspace.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Ownership has been transferred successfully',
        };
    }
};
exports.WorkspaceManagementService = WorkspaceManagementService;
exports.WorkspaceManagementService = WorkspaceManagementService = WorkspaceManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        workspace_query_service_1.WorkspaceQueryService,
        workspace_membership_service_1.WorkspaceMembershipService,
        member_service_1.MemberService,
        token_manager_service_1.TokenManager])
], WorkspaceManagementService);
//# sourceMappingURL=workspace-management.service.js.map