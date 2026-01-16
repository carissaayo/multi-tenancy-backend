import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MemberService } from 'src/modules/members/services/member.service';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelService } from './channel.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelInviteDto } from '../dtos/channel-invite.dto';
import { ChannelInvitation } from '../entities/channel_invitations.entity';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { EmailService } from 'src/core/email/services/email.service';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
export declare class ChannelInviteService {
    private readonly configService;
    private readonly dataSource;
    private readonly channelInvitationRepo;
    private readonly workspaceRepo;
    private readonly userRepo;
    private readonly memberService;
    private readonly channelQueryService;
    private readonly tokenManager;
    private readonly channelMembershipService;
    private readonly channelService;
    private readonly workspaceService;
    private readonly emailService;
    private readonly logger;
    private readonly INVITE_EXPIRY_DAYS;
    constructor(configService: ConfigService, dataSource: DataSource, channelInvitationRepo: Repository<ChannelInvitation>, workspaceRepo: Repository<Workspace>, userRepo: Repository<User>, memberService: MemberService, channelQueryService: ChannelQueryService, tokenManager: TokenManager, channelMembershipService: ChannelMembershipService, channelService: ChannelService, workspaceService: WorkspacesService, emailService: EmailService);
    inviteToJoinPrivateChannel(req: AuthenticatedRequest, id: string, channelInviteDto: ChannelInviteDto): Promise<{
        message: string;
        invitationId: string;
        token: string;
        accessToken: string;
        refreshToken: string;
    }>;
    acceptInvitation(token: string): Promise<{
        message: string;
        channel: import("../entities/channel.entity").Channel;
    }>;
    revokeInvitation(invitationId: string, req: AuthenticatedRequest): Promise<{
        message: string;
        invitationId: string;
        accessToken: string;
        refreshToken: string;
    }>;
}
