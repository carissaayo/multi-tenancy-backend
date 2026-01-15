import { ChannelService } from '../services/channel.service';
import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelController {
    private readonly channelService;
    constructor(channelService: ChannelService);
    createChannel(req: AuthenticatedRequest, createChannelDto: CreateChannelDto): Promise<{
        channel: import("../entities/channel.entity").Channel;
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    updateChannel(req: AuthenticatedRequest, id: string, updateChannelDto: UpdateChannelDto): Promise<{
        message: string;
        channel: import("../entities/channel.entity").Channel;
        accessToken: string;
        refreshToken: string;
    }>;
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
    deleteChannel(req: AuthenticatedRequest, id: string): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
    }>;
}
