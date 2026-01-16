import { DataSource } from 'typeorm';
import { WorkspacesService } from '../../workspaces/services/workspace.service';
import { MemberService } from '../../members/services/member.service';
import { Message } from '../entities/message.entity';
export declare class MessageService {
    private readonly dataSource;
    private readonly workspacesService;
    private readonly memberService;
    private readonly logger;
    constructor(dataSource: DataSource, workspacesService: WorkspacesService, memberService: MemberService);
    createMessage(workspaceId: string, channelId: string, userId: string, content: string, threadId?: string): Promise<Message>;
    getChannelMessages(workspaceId: string, channelId: string, limit?: number, offset?: number): Promise<Message[]>;
}
