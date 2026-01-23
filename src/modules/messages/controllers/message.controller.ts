import { Controller, Get, Param, Req } from "@nestjs/common";
import { MessageService } from "../services/message.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";

@ApiTags("Messages")
@Controller('messages')
export class MessageController {
    constructor(
        private readonly messageService: MessageService
    ) {


    }
    @Get(':channelId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get messages' })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
    })
    getMessages(
        @Req() req: AuthenticatedRequest,
        @Param('channelId') channelId: string
    ) {
        return this.messageService.getChannelMessages(req, channelId);
    }
}