import { ChannelManagementService } from '../services/channel-management.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelManagementController {
    private readonly channelManagementService;
    constructor(channelManagementService: ChannelManagementService);
    joinChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        channel: true;
        accessToken: string;
        refreshToken: string;
    }>;
}
