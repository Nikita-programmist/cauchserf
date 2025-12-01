import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (dto.stayRequestId) {
      const stay = await this.prisma.stayRequest.findUnique({ where: { id: dto.stayRequestId } });
      if (!stay) throw new NotFoundException('Stay request not found');
      if (stay.guestId !== userId && stay.hostId !== userId) {
        throw new ForbiddenException();
      }
    }
    return this.prisma.review.create({
      data: {
        authorId: userId,
        targetUserId: dto.targetUserId,
        stayRequestId: dto.stayRequestId ?? null,
        rating: dto.rating,
        comment: dto.comment ?? null
      }
    });
  }

  listForUser(targetUserId: string) {
    return this.prisma.review.findMany({
      where: { targetUserId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
