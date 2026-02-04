import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MemberService } from 'src/modules/members/services/member.service';
import { EmailService } from 'src/core/email/services/email.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { MessagingGateway } from 'src/modules/messages/gateways/messaging.gateway';
import { WorkspacesService } from './workspace.service';
import { ChannelMembershipService } from 'src/modules/channels/services/channel-membership.service';
import { WorkspaceInvitation } from '../entities/workspace_initations.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import { NoDataWorkspaceResponse, WorkspaceInvitationRole, WorkspaceInvitationStatus } from '../interfaces/workspace.interface';
export declare class WorkspaceInviteService {
    private readonly workspaceInvitationRepo;
    private readonly userRepo;
    private readonly memberService;
    private readonly emailService;
    private readonly configService;
    private readonly tokenManager;
    private readonly messagingGateway;
    private readonly dataSource;
    private readonly workspaceService;
    private readonly channelMembershipService;
    private readonly logger;
    private readonly INIVTE_EXPIRY_DAYS;
    constructor(workspaceInvitationRepo: Repository<WorkspaceInvitation>, userRepo: Repository<User>, memberService: MemberService, emailService: EmailService, configService: ConfigService, tokenManager: TokenManager, messagingGateway: MessagingGateway, dataSource: DataSource, workspaceService: WorkspacesService, channelMembershipService: ChannelMembershipService);
    inviteByEmail(req: AuthenticatedRequest, inviteDto: WorkspaceInviteDto): Promise<{
        message: string;
        invitationId: string;
        token: string;
        accessToken: string;
        refreshToken: string;
    }>;
    acceptInvitation(token: string): Promise<{
        message: string;
        workspace: Workspace;
    }>;
    revokeInvite(inviteId: string, req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse>;
    private addMemberToDefaultChannels;
    listWorkspaceInvites(req: AuthenticatedRequest): Promise<{
        invitations: {
            id: string;
            email: string;
            role: WorkspaceInvitationRole;
            status: WorkspaceInvitationStatus;
            invitedAt: Date;
            expiresAt: Date;
            acceptedAt: Date | null;
            revokedAt: Date | null;
            invitedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
            sentTo: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
            revokedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
        }[];
        total: number;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getMyInvitations(req: AuthenticatedRequest): Promise<{
        invitations: {
            id: string;
            token: string;
            email: string;
            role: WorkspaceInvitationRole;
            status: WorkspaceInvitationStatus;
            invitedAt: Date;
            expiresAt: Date;
            workspace: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string;
            } | null;
            invitedBy: {
                id: string;
                email: string;
                fullName: string | null;
                avatarUrl: string | null;
            } | null;
        }[];
        total: number;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    private hasInvitePermission;
}
