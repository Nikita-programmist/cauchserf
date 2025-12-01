import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (dto.stayRequestId) {
      const existing = await this.prisma.conversation.findFirst({ where: { stayRequestId: dto.stayRequestId } });
      if (existing) return existing;
    }

    const hostId = dto.hostId ?? userId;
    const guestId = dto.guestId ?? userId;

    const found = await this.prisma.conversation.findFirst({
      where: {
        hostId,
        guestId
      }
    });
    if (found) return found;

    return this.prisma.conversation.create({
      data: {
        hostId,
        guestId,
        stayRequestId: dto.stayRequestId ?? null
      }
    });
  }

  listForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ hostId: userId }, { guestId: userId }] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        host: { select: { id: true, email: true, name: true } },
        guest: { select: { id: true, email: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async listMessages(userId: string, conversationId: string) {
    await this.ensureAccess(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    await this.ensureAccess(userId, conversationId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content }
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  }

  private async ensureAccess(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.hostId !== userId && conversation.guestId !== userId)) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
