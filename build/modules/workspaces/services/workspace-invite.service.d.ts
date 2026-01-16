import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkspaceInvitation } from '../entities/workspace_initations.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { MemberService } from 'src/modules/members/services/member.service';
import { EmailService } from 'src/core/email/services/email.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { NoDataWorkspaceResponse } from '../interfaces/workspace.interface';
import { MessagingGateway } from 'src/modules/messages/gateways/messaging.gateway';
export declare class WorkspaceInviteService {
    private readonly workspaceInvitationRepo;
    private readonly userRepo;
    private readonly memberService;
    private readonly emailService;
    private readonly configService;
    private readonly tokenManager;
    private readonly messagingGateway;
    private readonly logger;
    private readonly INIVTE_EXPIRY_DAYS;
    constructor(workspaceInvitationRepo: Repository<WorkspaceInvitation>, userRepo: Repository<User>, memberService: MemberService, emailService: EmailService, configService: ConfigService, tokenManager: TokenManager, messagingGateway: MessagingGateway);
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
    listPendingInvites(workspaceId: string): Promise<void>;
    private hasInvitePermission;
}
