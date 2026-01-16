"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkspaceInviteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceInviteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
const workspace_initations_entity_1 = require("../entities/workspace_initations.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const member_service_1 = require("../../members/services/member.service");
const permission_interface_1 = require("../../../core/security/interfaces/permission.interface");
const email_service_1 = require("../../../core/email/services/email.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const workspace_interface_1 = require("../interfaces/workspace.interface");
const messaging_gateway_1 = require("../../messages/gateways/messaging.gateway");
let WorkspaceInviteService = WorkspaceInviteService_1 = class WorkspaceInviteService {
    workspaceInvitationRepo;
    userRepo;
    memberService;
    emailService;
    configService;
    tokenManager;
    messagingGateway;
    logger = new common_1.Logger(WorkspaceInviteService_1.name);
    INIVTE_EXPIRY_DAYS = 1;
    constructor(workspaceInvitationRepo, userRepo, memberService, emailService, configService, tokenManager, messagingGateway) {
        this.workspaceInvitationRepo = workspaceInvitationRepo;
        this.userRepo = userRepo;
        this.memberService = memberService;
        this.emailService = emailService;
        this.configService = configService;
        this.tokenManager = tokenManager;
        this.messagingGateway = messagingGateway;
    }
    async inviteByEmail(req, inviteDto) {
        const { email, role } = inviteDto;
        const user = req.user;
        const workspace = req.workspace;
        if (email === user.email) {
            throw custom_errors_1.customError.badRequest('You cannot invite yourself');
        }
        const isInviterAMember = await this.memberService.isUserMember(workspace.id, user.id);
        if (!isInviterAMember) {
            throw custom_errors_1.customError.forbidden('You must be a member of this workspace to send invitations');
        }
        const canInvite = await this.hasInvitePermission(workspace.id, req.userId, workspace);
        if (!canInvite) {
            throw custom_errors_1.customError.forbidden('You do not have permission to invite members to this workspace. Only admins and owners can invite members.');
        }
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (!existingUser) {
            throw custom_errors_1.customError.badRequest('No user found with this email');
        }
        const existingMember = await this.memberService.isUserMember(workspace.id, existingUser.id);
        if (existingMember) {
            throw custom_errors_1.customError.badRequest('This user is already a member of this workspace');
        }
        const existingInvitation = await this.workspaceInvitationRepo.findOne({
            where: {
                workspaceId: workspace.id,
                email,
                status: workspace_interface_1.WorkspaceInvitationStatus.PENDING,
            },
        });
        if (existingInvitation) {
            if (existingInvitation.expiresAt > new Date()) {
                throw custom_errors_1.customError.badRequest('This email is already invited to this workspace');
            }
            existingInvitation.status = workspace_interface_1.WorkspaceInvitationStatus.EXPIRED;
            await this.workspaceInvitationRepo.save(existingInvitation);
            this.logger.log(`Expired invitation for ${email} in workspace ${workspace.id} marked as EXPIRED`);
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * this.INIVTE_EXPIRY_DAYS);
        const invitation = this.workspaceInvitationRepo.create({
            workspaceId: workspace.id,
            email,
            invitedBy: req.userId,
            expiresAt,
            token,
            role: role ?? workspace_interface_1.WorkspaceInvitationRole.MEMBER,
            sentToId: existingUser.id,
            sentTo: existingUser,
        });
        await this.workspaceInvitationRepo.save(invitation);
        const frontendUrl = this.configService.get('frontend.url') || 'http://localhost:8000';
        const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;
        const inviterName = user.fullName || user.email;
        this.emailService.sendWorkspaceInvitation(email, workspace.name, inviterName, inviteLink, expiresAt.toISOString());
        this.logger.log(`Invitation sent to ${email} for workspace ${workspace.name}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Invitation sent successfully',
            invitationId: invitation.id,
            token: token,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async acceptInvitation(token) {
        const invitation = await this.workspaceInvitationRepo.findOne({
            where: { token, status: workspace_interface_1.WorkspaceInvitationStatus.PENDING },
            relations: ['workspace'],
        });
        if (!invitation) {
            throw custom_errors_1.customError.notFound('Invalid or expired invitation');
        }
        if (invitation.expiresAt < new Date()) {
            invitation.status = workspace_interface_1.WorkspaceInvitationStatus.EXPIRED;
            await this.workspaceInvitationRepo.save(invitation);
            throw custom_errors_1.customError.badRequest('This invitation has expired');
        }
        const user = await this.userRepo.findOne({
            where: { id: invitation.sentToId },
        });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        if (user.email !== invitation.email) {
            throw custom_errors_1.customError.forbidden('This invitation was sent to a different email address');
        }
        const existingMember = await this.memberService.isUserMember(invitation.workspaceId, user.id);
        if (existingMember) {
            throw custom_errors_1.customError.badRequest('This user is already a member of this workspace');
        }
        await this.workspaceInvitationRepo.delete({
            workspaceId: invitation.workspaceId,
            email: invitation.email,
            status: workspace_interface_1.WorkspaceInvitationStatus.ACCEPTED,
        });
        invitation.status = workspace_interface_1.WorkspaceInvitationStatus.ACCEPTED;
        invitation.acceptedAt = new Date();
        invitation.acceptedBy = user.id;
        await this.workspaceInvitationRepo.save(invitation);
        const workspace = invitation.workspace;
        const inviterId = invitation.invitedBy;
        if (!inviterId) {
            throw custom_errors_1.customError.badRequest('InviterId not found');
        }
        const inviter = await this.userRepo.findOne({
            where: { id: inviterId },
        });
        if (!inviter) {
            throw custom_errors_1.customError.notFound('Inviter not found');
        }
        await this.memberService.addMemberToWorkspace(workspace.id, user.id, invitation.role ?? workspace_interface_1.WorkspaceInvitationRole.MEMBER);
        await this.messagingGateway.joinUserToWorkspace(user.id, workspace.id);
        this.messagingGateway.emitToUser(user.id, 'workspaceJoined', {
            workspace: {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
            },
            message: 'You have successfully joined the workspace',
        });
        this.messagingGateway.emitToWorkspace(workspace.id, 'memberJoined', {
            workspaceId: workspace.id,
            member: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
            },
            role: invitation.role ?? workspace_interface_1.WorkspaceInvitationRole.MEMBER,
            joinedAt: new Date(),
        });
        this.logger.log(`User ${user.id} accepted invitation and joined workspace ${workspace.id}`);
        const frontendUrl = this.configService.get('frontend.url') || 'http://localhost:8000';
        const workspaceUrl = `${frontendUrl}/workspace/${workspace.id}`;
        await this.emailService.sendWelcomeToWorkspace(user.email, user.fullName || user.email, workspace.name, workspaceUrl, inviter ? `${inviter.fullName}` : undefined);
        return {
            message: 'You have successfully joined the workspace',
            workspace,
        };
    }
    async revokeInvite(inviteId, req) {
        const user = req.user;
        const invitation = await this.workspaceInvitationRepo.findOne({
            where: { id: inviteId },
        });
        if (!invitation) {
            throw custom_errors_1.customError.notFound('Invitation not found');
        }
        if (invitation.status !== workspace_interface_1.WorkspaceInvitationStatus.PENDING) {
            throw custom_errors_1.customError.badRequest('Invitation can no longer be revoked');
        }
        if (invitation.expiresAt < new Date()) {
            throw custom_errors_1.customError.badRequest('Invitation has already expired');
        }
        if (invitation.workspaceId !== req.workspaceId) {
            throw custom_errors_1.customError.badRequest('Invitation is not for this workspace');
        }
        if (invitation.invitedBy !== user.id) {
            throw custom_errors_1.customError.badRequest('You can only revoke invitations you sent');
        }
        invitation.revokedBy = user.id;
        invitation.revokedByUser = user;
        invitation.revokedAt = new Date();
        invitation.status = workspace_interface_1.WorkspaceInvitationStatus.REVOKED;
        await this.workspaceInvitationRepo.save(invitation);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Invitation revoked successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async listPendingInvites(workspaceId) { }
    async hasInvitePermission(workspaceId, userId, workspace) {
        if (workspace.createdBy === userId || workspace.ownerId === userId) {
            this.logger.debug(`User ${userId} is the owner of workspace ${workspaceId}`);
            return true;
        }
        const member = await this.memberService.isUserMember(workspaceId, userId);
        if (!member || !member.isActive) {
            this.logger.warn(`User ${userId} is not a member of workspace ${workspaceId}`);
            return false;
        }
        const hasPermission = member.permissions?.includes(permission_interface_1.PermissionsEnum.MEMBER_INVITE);
        const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
        const canInvite = hasPermission || isOwnerOrAdmin;
        if (!canInvite) {
            this.logger.warn(`User ${userId} does not have invite permission in workspace ${workspaceId}`);
        }
        return canInvite;
    }
};
exports.WorkspaceInviteService = WorkspaceInviteService;
exports.WorkspaceInviteService = WorkspaceInviteService = WorkspaceInviteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_initations_entity_1.WorkspaceInvitation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => member_service_1.MemberService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => messaging_gateway_1.MessagingGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        member_service_1.MemberService,
        email_service_1.EmailService,
        config_1.ConfigService,
        token_manager_service_1.TokenManager,
        messaging_gateway_1.MessagingGateway])
], WorkspaceInviteService);
//# sourceMappingURL=workspace-invite.service.js.map