import { ChannelInviteService } from '../services/channel-invite.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelInviteDto } from '../dtos/channel-invite.dto';
export declare class ChannelInviteController {
    private readonly channelInviteService;
    constructor(channelInviteService: ChannelInviteService);
    inviteToJoinPrivateChannel(req: AuthenticatedRequest, id: string, channelInviteDto: ChannelInviteDto): Promise<{
        message: string;
        invitationId: string;
        accessToken: string;
        refreshToken: string;
    }>;
    revokeInvitation(invitationId: string, req: AuthenticatedRequest): Promise<{
        message: string;
        invitationId: string;
        accessToken: string;
        refreshToken: string;
    }>;
    acceptInvitation(token: string): Promise<{
        message: string;
        channel: import("../entities/channel.entity").Channel;
    }>;
}
