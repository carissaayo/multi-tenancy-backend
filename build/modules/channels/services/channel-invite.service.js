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
var ChannelInviteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelInviteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
const member_service_1 = require("../../members/services/member.service");
const channel_query_service_1 = require("./channel-query.service");
const channel_membership_service_1 = require("./channel-membership.service");
const channel_service_1 = require("./channel.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const channel_invitations_entity_1 = require("../entities/channel_invitations.entity");
const workspace_interface_1 = require("../../workspaces/interfaces/workspace.interface");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const email_service_1 = require("../../../core/email/services/email.service");
const workspace_entity_1 = require("../../workspaces/entities/workspace.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let ChannelInviteService = ChannelInviteService_1 = class ChannelInviteService {
    configService;
    dataSource;
    channelInvitationRepo;
    workspaceRepo;
    userRepo;
    memberService;
    channelQueryService;
    tokenManager;
    channelMembershipService;
    channelService;
    workspaceService;
    emailService;
    logger = new common_1.Logger(ChannelInviteService_1.name);
    INVITE_EXPIRY_DAYS = 1;
    constructor(configService, dataSource, channelInvitationRepo, workspaceRepo, userRepo, memberService, channelQueryService, tokenManager, channelMembershipService, channelService, workspaceService, emailService) {
        this.configService = configService;
        this.dataSource = dataSource;
        this.channelInvitationRepo = channelInvitationRepo;
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.memberService = memberService;
        this.channelQueryService = channelQueryService;
        this.tokenManager = tokenManager;
        this.channelMembershipService = channelMembershipService;
        this.channelService = channelService;
        this.workspaceService = workspaceService;
        this.emailService = emailService;
    }
    async inviteToJoinPrivateChannel(req, id, channelInviteDto) {
        const { memberId } = channelInviteDto;
        const user = req.user;
        const workspace = req.workspace;
        const channel = await this.channelQueryService.findChannelById(id, workspace.id);
        if (!channel) {
            throw custom_errors_1.customError.notFound('Channel not found');
        }
        if (!channel.isPrivate) {
            throw custom_errors_1.customError.badRequest('You can only invite members to private channels');
        }
        const inviterMember = await this.memberService.isUserMember(workspace.id, user.id);
        if (!inviterMember) {
            throw custom_errors_1.customError.forbidden('You must be a workspace member to invite others');
        }
        if (inviterMember.id === memberId) {
            throw custom_errors_1.customError.forbidden('You cannot invite yourself to this channel');
        }
        const isInviterChannelMember = await this.channelMembershipService.isUserMember(id, inviterMember.id, workspace.id);
        if (!isInviterChannelMember) {
            throw custom_errors_1.customError.forbidden('You must be a member of this channel to invite others');
        }
        const hasPermission = await this.channelService.hasChannelManagementPermission(workspace.id, user.id, workspace);
        if (!hasPermission && channel.createdBy !== user.id) {
            throw custom_errors_1.customError.forbidden('You do not have permission to invite members to this channel');
        }
        const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const [invitedMember] = await this.dataSource.query(`SELECT m.id, m.user_id, u.email 
       FROM "${schemaName}".members m
       INNER JOIN public.users u ON m.user_id = u.id
       WHERE m.id = $1 AND m.is_active = true 
       LIMIT 1`, [memberId]);
        if (!invitedMember) {
            throw custom_errors_1.customError.badRequest('The user is not a member of this workspace');
        }
        const isMemberChannelMember = await this.channelMembershipService.isUserMember(id, memberId, workspace.id);
        if (isMemberChannelMember) {
            throw custom_errors_1.customError.badRequest('The user is already a member of this channel');
        }
        const existingInvitation = await this.channelInvitationRepo.findOne({
            where: {
                channelId: id,
                memberId: memberId,
                workspaceId: workspace.id,
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
                status: workspace_interface_1.WorkspaceInvitationStatus.PENDING,
            },
        });
        if (existingInvitation) {
            throw custom_errors_1.customError.badRequest('This member already has a pending invitation to this channel');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * this.INVITE_EXPIRY_DAYS);
        const invitation = this.channelInvitationRepo.create({
            channelId: id,
            workspaceId: workspace.id,
            memberId: memberId,
            invitedBy: user.id,
            expiresAt,
            token,
            status: workspace_interface_1.WorkspaceInvitationStatus.PENDING,
        });
        await this.channelInvitationRepo.save(invitation);
        const frontendUrl = this.configService.get('frontend.url') || 'http://localhost:8000';
        const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;
        const inviterName = user.fullName || user.email;
        this.emailService.sendChannelInvitation(invitedMember.email, workspace.name, channel.name, inviterName, inviteLink, expiresAt.toISOString());
        this.logger.log(`Channel invitation sent: member ${memberId} to channel ${id} in workspace ${workspace.id}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Invitation to join the channel sent successfully',
            invitationId: invitation.id,
            token: token,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async acceptInvitation(token) {
        const invitation = await this.channelInvitationRepo.findOne({
            where: { token, status: workspace_interface_1.WorkspaceInvitationStatus.PENDING },
        });
        if (!invitation) {
            throw custom_errors_1.customError.notFound('Invalid or expired invitation');
        }
        if (invitation.expiresAt < new Date()) {
            invitation.status = workspace_interface_1.WorkspaceInvitationStatus.EXPIRED;
            await this.channelInvitationRepo.save(invitation);
            throw custom_errors_1.customError.badRequest('This invitation has expired');
        }
        const workspace = await this.workspaceRepo.findOne({
            where: { id: invitation.workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspaceService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const [member] = await this.dataSource.query(`SELECT id, user_id FROM "${schemaName}".members WHERE id = $1 AND is_active = true LIMIT 1`, [invitation.memberId]);
        if (!member) {
            throw custom_errors_1.customError.notFound('Member not found in this workspace');
        }
        const user = await this.userRepo.findOne({
            where: { id: member.user_id },
        });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        const isChannelMember = await this.channelMembershipService.isUserMember(invitation.channelId, invitation.memberId, workspace.id);
        if (isChannelMember) {
            throw custom_errors_1.customError.badRequest('You are already a member of this channel');
        }
        await this.channelInvitationRepo.delete({
            channelId: invitation.channelId,
            memberId: invitation.memberId,
            status: workspace_interface_1.WorkspaceInvitationStatus.ACCEPTED,
        });
        invitation.status = workspace_interface_1.WorkspaceInvitationStatus.ACCEPTED;
        invitation.acceptedAt = new Date();
        invitation.acceptedBy = user.id;
        await this.channelInvitationRepo.save(invitation);
        const channel = await this.channelMembershipService.addMemberToChannel(invitation.channelId, invitation.memberId, workspace.id);
        this.logger.log(`Channel invitation accepted: member ${invitation.memberId} joined channel ${invitation.channelId}`);
        return {
            message: 'You have successfully joined the channel',
            channel: channel,
        };
    }
    async revokeInvitation(invitationId, req) {
        const user = req.user;
        const workspace = req.workspace;
        const invitation = await this.channelInvitationRepo.findOne({
            where: { id: invitationId },
        });
        if (!invitation) {
            throw custom_errors_1.customError.notFound('Invitation not found');
        }
        if (invitation.workspaceId !== workspace.id) {
            throw custom_errors_1.customError.forbidden('Invitation is not for this workspace');
        }
        if (invitation.status !== workspace_interface_1.WorkspaceInvitationStatus.PENDING) {
            throw custom_errors_1.customError.badRequest('Invitation can no longer be revoked');
        }
        if (invitation.expiresAt < new Date()) {
            throw custom_errors_1.customError.badRequest('Invitation has already expired');
        }
        if (invitation.invitedBy !== user.id) {
            throw custom_errors_1.customError.forbidden('You can only revoke invitations you sent');
        }
        invitation.revokedBy = user.id;
        invitation.revokedAt = new Date();
        invitation.status = workspace_interface_1.WorkspaceInvitationStatus.REVOKED;
        await this.channelInvitationRepo.save(invitation);
        this.logger.log(`Channel invitation ${invitationId} revoked`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            message: 'Invitation revoked successfully',
            invitationId: invitation.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
};
exports.ChannelInviteService = ChannelInviteService;
exports.ChannelInviteService = ChannelInviteService = ChannelInviteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(channel_invitations_entity_1.ChannelInvitation)),
    __param(3, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        member_service_1.MemberService,
        channel_query_service_1.ChannelQueryService,
        token_manager_service_1.TokenManager,
        channel_membership_service_1.ChannelMembershipService,
        channel_service_1.ChannelService,
        workspace_service_1.WorkspacesService,
        email_service_1.EmailService])
], ChannelInviteService);
//# sourceMappingURL=channel-invite.service.js.map