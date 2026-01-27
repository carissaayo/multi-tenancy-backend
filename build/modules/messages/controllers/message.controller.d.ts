import { MessageService } from "../services/message.service";
import type { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { UpdateMessageDto } from "../dtos/message.dto";
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    getChannelMessages(req: AuthenticatedRequest, channelId: string, limit?: number, cursor?: string, direction?: 'before' | 'after'): Promise<{
        messages: import("../entities/message.entity").Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getMyMessages(req: AuthenticatedRequest, channelId?: string, limit?: number, cursor?: string, direction?: 'before' | 'after'): Promise<{
        messages: import("../entities/message.entity").Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getMemberMessages(req: AuthenticatedRequest, memberId: string, channelId?: string, limit?: number, cursor?: string, direction?: 'before' | 'after'): Promise<{
        messages: import("../entities/message.entity").Message[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    getSingleMessage(req: AuthenticatedRequest, messageId: string): Promise<import("../entities/message.entity").Message | null>;
    updateMessageBySender(req: AuthenticatedRequest, messageId: string, dto: UpdateMessageDto): Promise<import("../entities/message.entity").Message>;
}
