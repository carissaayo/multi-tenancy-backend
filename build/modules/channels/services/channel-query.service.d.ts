import { DataSource } from 'typeorm';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { Channel } from '../entities/channel.entity';
export declare class ChannelQueryService {
    private readonly dataSource;
    private readonly workspaceRepo;
    private readonly workspacesService;
    private readonly logger;
    constructor(dataSource: DataSource, workspaceRepo: Repository<Workspace>, workspacesService: WorkspacesService);
    findChannelById(channelId: string, workspaceId: string): Promise<Channel | null>;
    findAllChannelsInAWorkspace(workspaceId: string, memberId?: string): Promise<Channel[]>;
}
