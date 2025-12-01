import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateStayDto } from './dto/create-stay.dto';
import { StayStatus } from './dto/update-stay-status.dto';

@Injectable()
export class StaysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateStayDto) {
    const place = await this.prisma.place.findUnique({ where: { id: dto.placeId }, include: { hostProfile: true } });
    if (!place) {
      throw new NotFoundException('Place not found');
    }
    return this.prisma.stayRequest.create({
      data: {
        placeId: dto.placeId,
        guestId: userId,
        hostId: place.hostProfile.userId,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        message: dto.message ?? null,
        status: StayStatus.PENDING
      }
    });
  }

  listForGuest(userId: string) {
    return this.prisma.stayRequest.findMany({
      where: { guestId: userId },
      include: { place: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  listForHost(userId: string) {
    return this.prisma.stayRequest.findMany({
      where: { hostId: userId },
      include: { place: true, guest: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(userId: string, id: string, status: StayStatus) {
    const request = await this.prisma.stayRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.hostId !== userId && request.guestId !== userId) {
      throw new ForbiddenException();
    }
    return this.prisma.stayRequest.update({ where: { id }, data: { status } });
  }
}
