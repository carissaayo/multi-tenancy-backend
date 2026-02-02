import { DataSource } from 'typeorm';
import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { ChannelQueryService } from './channel-query.service';
import { MessagingGateway } from 'src/modules/messages/gateways/messaging.gateway';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelMembershipService {
    private readonly dataSource;
    private readonly workspaceRepo;
    private readonly workspacesService;
    private readonly memberService;
    private readonly channelQueryService;
    private readonly tokenManager;
    private readonly messagingGateway;
    private readonly logger;
    constructor(dataSource: DataSource, workspaceRepo: Repository<Workspace>, workspacesService: WorkspacesService, memberService: MemberService, channelQueryService: ChannelQueryService, tokenManager: TokenManager, messagingGateway: MessagingGateway);
    isUserMember(channelId: string, memberId: string, workspaceId: string): Promise<boolean>;
    getChannel(req: AuthenticatedRequest, id: string): Promise<{
        channel: import("../entities/channel.entity").Channel;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getAllChannelsInAWorkspace(req: AuthenticatedRequest): Promise<{
        channels: import("../entities/channel.entity").Channel[];
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    joinChannel(req: AuthenticatedRequest, id: string, memberId: string): Promise<boolean>;
    addMemberToChannel(channelId: string, memberId: string, workspaceId: string): Promise<import("../entities/channel.entity").Channel>;
    getChannelMembers(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channelMembers: any;
        totalChannelMembers: any;
        accessToken: string;
        refreshToken: string;
    }>;
    leaveChannel(channelId: string, memberId: string, workspaceId: string): Promise<boolean>;
    removeMemberFromChannel(channelId: string, targetMemberId: string, workspaceId: string): Promise<boolean>;
}
