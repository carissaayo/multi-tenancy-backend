import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { MessageService } from "../services/message.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { GetMessagesDto, UpdateMessageDto } from "../dtos/message.dto";

@ApiTags("Messages")
@Controller('messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new message' })
    createMessage(
        @Req() req: AuthenticatedRequest,
        @Body() dto: { channelId: string; content: string; threadId?: string }
    ) {
        return this.messageService.createMessage(
            req.workspaceId!,
            dto.channelId,
            req.userId,
            dto.content,
            dto.threadId,
        );
    }

    // GET /messages/channel/:channelId
    @Get('channel/:channelId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages from a channel' })
    getChannelMessages(
        @Req() req: AuthenticatedRequest,
        @Param('channelId') channelId: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
        @Query('direction') direction?: 'before' | 'after'
    ) {
      
        return this.messageService.getChannelMessages(req, channelId );
    }

    // GET /messages/member (current user)
    @Get('member')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages by current member' })
    getMyMessages(
        @Req() req: AuthenticatedRequest,
        @Query('channelId') channelId?: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
        @Query('direction') direction?: 'before' | 'after'
    ) {
        req.query = {
            ...req.query,
            limit: limit?.toString(),
            cursor,
            direction
        };
        return this.messageService.getMessagesByMember(
            req,
            { channelId: channelId || '' },
            { limit, cursor, direction }
        );
    }

    // GET /messages/member/:memberId (specific member)
    @Get('member/:memberId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages by specific member' })
    getMemberMessages(
        @Req() req: AuthenticatedRequest,
        @Param('memberId') memberId: string,
        @Query('channelId') channelId?: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
        @Query('direction') direction?: 'before' | 'after'
    ) {
        req.query = {
            ...req.query,
            limit: limit?.toString(),
            cursor,
            direction
        };
        return this.messageService.getMessagesByMember(
            req,
            { channelId: channelId || '' },
            { limit, cursor, direction, memberUserId: memberId }
        );
    }

    // GET /messages/:messageId (already correct)
    @Get(':messageId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get single message' })
    getSingleMessage(
        @Req() req: AuthenticatedRequest,
        @Param('messageId') messageId: string
    ) {
        return this.messageService.getMessageById(req, messageId);
    }

    // PATCH /messages/:messageId (already correct)
    @Patch(':messageId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update message by sender' })
    updateMessageBySender(
        @Req() req: AuthenticatedRequest,
        @Param('messageId') messageId: string,
        @Body() dto: UpdateMessageDto
    ) {
        return this.messageService.updateMessageBySender(req, messageId, dto);
    }
}