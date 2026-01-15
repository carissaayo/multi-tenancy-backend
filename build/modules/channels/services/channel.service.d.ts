import { ChannelLifecycleService } from './channel-lifecycle.service';
import { ChannelMembershipService } from './channel-membership.service';
import { ChannelQueryService } from './channel-query.service';
import { MemberService } from 'src/modules/members/services/member.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { Channel } from '../entities/channel.entity';
import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelService {
    private readonly memberService;
    private readonly channelLifecycleService;
    private readonly channelMembershipService;
    private readonly channelQueryService;
    private readonly tokenManager;
    private readonly logger;
    constructor(memberService: MemberService, channelLifecycleService: ChannelLifecycleService, channelMembershipService: ChannelMembershipService, channelQueryService: ChannelQueryService, tokenManager: TokenManager);
    createChannel(req: AuthenticatedRequest, dto: CreateChannelDto): Promise<{
        channel: Channel;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    updateChannel(req: AuthenticatedRequest, id: string, updateDto: UpdateChannelDto): Promise<{
        message: string;
        channel: Channel;
        accessToken: string;
        refreshToken: string;
    }>;
    getChannel(req: AuthenticatedRequest, id: string): Promise<{
        channel: Channel;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    getAllChannelsInAWorkspace(req: AuthenticatedRequest): Promise<{
        channels: Channel[];
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    deleteChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
    }>;
    hasChannelManagementPermission(workspaceId: string, userId: string, workspace: {
        ownerId: string;
        createdBy: string;
    }): Promise<boolean>;
    getChannelMembers(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channelMembers: any;
        totalChannelMembers: any;
        accessToken: string;
        refreshToken: string;
    }>;
}
