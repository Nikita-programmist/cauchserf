import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  createConversation(@CurrentUser() user: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(user.userId, dto);
  }

  @Get('conversations')
  list(@CurrentUser() user: any) {
    return this.chatService.listForUser(user.userId);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.listMessages(user.userId, id);
  }

  @Post('conversations/:id/messages')
  send(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.userId, id, dto.content);
  }
}
