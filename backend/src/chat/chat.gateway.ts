import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('join_conversation')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(data.conversationId);
    client.emit('joined', data.conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('send_message')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; userId: string }
  ) {
    const message = await this.chatService.sendMessage(data.userId, data.conversationId, data.content);
    this.server.to(data.conversationId).emit('new_message', message);
    client.emit('sent', message.id);
  }
}
