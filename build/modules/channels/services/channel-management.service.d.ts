import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelQueryService } from './channel-query.service';
import { ChannelMembershipService } from './channel-membership.service';
export declare class ChannelManagementService {
    private readonly workspacesService;
    private readonly memberService;
    private readonly channelQueryService;
    private readonly channelMembershipService;
    private readonly tokenManager;
    private readonly logger;
    constructor(workspacesService: WorkspacesService, memberService: MemberService, channelQueryService: ChannelQueryService, channelMembershipService: ChannelMembershipService, tokenManager: TokenManager);
    joinChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channel: true;
        accessToken: string;
        refreshToken: string;
    }>;
}
