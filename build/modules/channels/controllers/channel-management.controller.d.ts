import { ChannelManagementService } from '../services/channel-management.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { RemoveMemberFromChannelDto, AddMemberToChannelDto } from '../dtos/channel-management.dto';
export declare class ChannelManagementController {
    private readonly channelManagementService;
    constructor(channelManagementService: ChannelManagementService);
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
    addMemberToChannel(req: AuthenticatedRequest, id: string, dto: AddMemberToChannelDto): Promise<{
        message: string;
        channelId: string;
        memberId: string;
        accessToken: string;
        refreshToken: string;
    }>;
}
