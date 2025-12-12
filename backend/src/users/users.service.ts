import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        hostProfile: {
          select: {
            id: true,
            bio: true,
            city: true,
            country: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRole(userId: string, role: UserRole) {
    if (![UserRole.TRAVELER, UserRole.HOST].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { role },
        include: { hostProfile: true }
      });

      if (role === UserRole.HOST && !user.hostProfile) {
        const hostProfile = await tx.hostProfile.create({ data: { userId } });
        return { ...user, hostProfile };
      }

      return user;
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      hostProfile: updatedUser.hostProfile
    };
  }
}
