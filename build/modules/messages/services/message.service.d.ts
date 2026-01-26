import { DataSource } from 'typeorm';
import { WorkspacesService } from '../../workspaces/services/workspace.service';
import { MemberService } from '../../members/services/member.service';
import { Message } from '../entities/message.entity';
import { ChannelMembershipService } from 'src/modules/channels/services/channel-membership.service';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelQueryService } from 'src/modules/channels/services/channel-query.service';
import { GetMessagesDto, UpdateMessageDto } from '../dtos/message.dto';
export declare class MessageService {
    private readonly dataSource;
    private readonly workspacesService;
    private readonly memberService;
    private readonly channelMembershipService;
    private readonly channelQueryService;
    private readonly logger;
    constructor(dataSource: DataSource, workspacesService: WorkspacesService, memberService: MemberService, channelMembershipService: ChannelMembershipService, channelQueryService: ChannelQueryService);
    private validateWorkspaceMembership;
    private validateChannelMembership;
    createMessage(workspaceId: string, channelId: string, userId: string, content: string, threadId?: string): Promise<Message>;
    getChannelMessages(req: AuthenticatedRequest, dto: GetMessagesDto): Promise<{
        messages: Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getMessagesByMember(req: AuthenticatedRequest, dto: GetMessagesDto, options?: {
        limit?: number;
        cursor?: string;
        direction?: 'before' | 'after';
        memberUserId?: string;
    }): Promise<{
        messages: Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getMessageById(req: AuthenticatedRequest, messageId: string): Promise<Message | null>;
    updateMessageBySender(req: AuthenticatedRequest, messageId: string, dto: UpdateMessageDto): Promise<Message>;
    deleteMessageBySender(req: AuthenticatedRequest, messageId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteMessageByAdmin(req: AuthenticatedRequest, messageId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
