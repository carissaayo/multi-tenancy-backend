import { Body, Controller, Get, Param, Req } from "@nestjs/common";
import { MessageService } from "../services/message.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { GetMessagesDto } from "../dtos/message.dto";

@ApiTags("Messages")
@Controller('messages')
export class MessageController {
    constructor(
        private readonly messageService: MessageService
    ) {}
    @Get('')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages' })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
    })
    getMessages(
        @Req() req: AuthenticatedRequest,
        @Body()dto: GetMessagesDto 
    ) {
        return this.messageService.getChannelMessages(req, dto);
    }

    @Get('member')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages' })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
    })
    getMessagesByMember(
        @Req() req: AuthenticatedRequest,
        @Body() dto: GetMessagesDto
    ) {
        return this.messageService.getMessagesByMember(req, dto);
    }

    @Get(':messageId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages' })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
    })
    getSingleMessage(
        @Req() req: AuthenticatedRequest,
        @Param('messageId') messageId: string
        
    ) {
        return this.messageService.getMessageById(req, messageId);
    }


}