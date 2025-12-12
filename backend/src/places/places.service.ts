import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  search(city?: string) {
    return this.list({ city });
  }

  list(filters: { city?: string; country?: string; guests?: number }) {
    return this.prisma.place.findMany({
      where: {
        city: filters.city ? { contains: filters.city, mode: 'insensitive' } : undefined,
        country: filters.country ? { contains: filters.country, mode: 'insensitive' } : undefined,
        capacity: filters.guests ? { gte: filters.guests } : undefined
      },
      include: {
        hostProfile: { include: { user: { select: { id: true, email: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async listForHost(userId: string) {
    const hostProfile = await this.prisma.hostProfile.findUnique({ where: { userId } });
    if (!hostProfile) return [];

    return this.prisma.place.findMany({
      where: { hostProfileId: hostProfile.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: {
        hostProfile: { include: { user: { select: { id: true, email: true, name: true } } } }
      }
    });
    if (!place) {
      throw new NotFoundException('Place not found');
    }
    return place;
  }

  async create(userId: string, dto: CreatePlaceDto) {
    let hostProfile = await this.prisma.hostProfile.findUnique({ where: { userId } });
    if (!hostProfile) {
      hostProfile = await this.prisma.hostProfile.create({ data: { userId } });
    }

    return this.prisma.place.create({
      data: {
        ...dto,
        hostProfileId: hostProfile.id
      }
    });
  }
}
