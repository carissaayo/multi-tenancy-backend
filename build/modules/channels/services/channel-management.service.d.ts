import { DataSource } from 'typeorm';
import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelService } from './channel.service';
import { RemoveMemberFromChannelDto } from '../dtos/channel-management.dto';
export declare class ChannelManagementService {
    private readonly dataSource;
    private readonly workspacesService;
    private readonly memberService;
    private readonly channelQueryService;
    private readonly channelMembershipService;
    private readonly channelService;
    private readonly tokenManager;
    private readonly logger;
    constructor(dataSource: DataSource, workspacesService: WorkspacesService, memberService: MemberService, channelQueryService: ChannelQueryService, channelMembershipService: ChannelMembershipService, channelService: ChannelService, tokenManager: TokenManager);
    joinChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channel: import("../entities/channel.entity").Channel;
        accessToken: string;
        refreshToken: string;
    }>;
    leaveChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
    }>;
    removeMemberFromChannel(req: AuthenticatedRequest, id: string, dto: RemoveMemberFromChannelDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
    }>;
}
