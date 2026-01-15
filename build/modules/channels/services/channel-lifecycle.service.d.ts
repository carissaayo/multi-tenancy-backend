import { DataSource } from 'typeorm';
import { MemberService } from 'src/modules/members/services/member.service';
import { ChannelQueryService } from './channel-query.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';
import { Channel } from '../entities/channel.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class ChannelLifecycleService {
    private readonly dataSource;
    private readonly memberService;
    private readonly workspaceService;
    private readonly channelQueryService;
    private readonly logger;
    constructor(dataSource: DataSource, memberService: MemberService, workspaceService: WorkspacesService, channelQueryService: ChannelQueryService);
    createChannel(user: User, workspace: Workspace, dto: CreateChannelDto): Promise<Channel>;
    updateChannel(req: AuthenticatedRequest, id: string, updateDto: UpdateChannelDto): Promise<Channel>;
    deleteChannel(req: AuthenticatedRequest, id: string): Promise<void>;
}
