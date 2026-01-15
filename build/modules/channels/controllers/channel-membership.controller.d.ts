import { ChannelMembershipService } from '../services/channel-membership.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelMembershipController {
    private readonly channelMembershipService;
    constructor(channelMembershipService: ChannelMembershipService);
    getChannelMembers(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channelMembers: any;
        totalChannelMembers: any;
        accessToken: string;
        refreshToken: string;
    }>;
}
