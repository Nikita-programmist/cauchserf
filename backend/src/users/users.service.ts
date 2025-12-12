import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
        },
        guestProfile: {
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
    if (![UserRole.GUEST, UserRole.HOST].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { role },
        include: { hostProfile: true, guestProfile: true }
      });

      if (role === UserRole.HOST && !user.hostProfile) {
        const hostProfile = await tx.hostProfile.create({ data: { userId } });
        return { ...user, hostProfile };
      }

      if (role === UserRole.GUEST && !user.guestProfile) {
        const guestProfile = await tx.guestProfile.create({ data: { userId } });
        return { ...user, guestProfile };
      }

      return user;
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      hostProfile: updatedUser.hostProfile,
      guestProfile: updatedUser.guestProfile
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        hostProfile: true,
        guestProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile =
      user.role === UserRole.HOST
        ? user.hostProfile
        : user.role === UserRole.GUEST
          ? user.guestProfile
          : null;

    if (!profile) {
      throw new NotFoundException({ code: 'PROFILE_NOT_CREATED', message: 'Profile is not created yet' });
    }

    return user;
  }

  async completeOnboarding(userId: string, role: UserRole) {
    if (![UserRole.GUEST, UserRole.HOST].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { role },
        include: { hostProfile: true, guestProfile: true }
      });

      if (role === UserRole.HOST && !user.hostProfile) {
        const hostProfile = await tx.hostProfile.create({ data: { userId } });
        return { ...user, hostProfile };
      }

      if (role === UserRole.GUEST && !user.guestProfile) {
        const guestProfile = await tx.guestProfile.create({ data: { userId } });
        return { ...user, guestProfile };
      }

      return user;
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const allowedRole = dto.role as UserRole | undefined;
    if (allowedRole && ![UserRole.GUEST, UserRole.HOST].includes(allowedRole)) {
      throw new BadRequestException('Invalid role');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, include: { hostProfile: true, guestProfile: true } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const targetRole = allowedRole ?? user.role ?? UserRole.GUEST;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: dto.name ?? user.name,
          avatarUrl: dto.avatarUrl ?? user.avatarUrl,
          role: targetRole
        },
        include: { hostProfile: true, guestProfile: true }
      });

      if (targetRole === UserRole.HOST) {
        const hostProfile = updatedUser.hostProfile
          ? await tx.hostProfile.update({
              where: { id: updatedUser.hostProfile.id },
              data: { bio: dto.bio ?? updatedUser.hostProfile.bio, city: dto.city ?? updatedUser.hostProfile.city, country: dto.country ?? updatedUser.hostProfile.country }
            })
          : await tx.hostProfile.create({ data: { userId, bio: dto.bio, city: dto.city, country: dto.country } });

        return { ...updatedUser, hostProfile };
      }

      const guestProfile = updatedUser.guestProfile
        ? await tx.guestProfile.update({
            where: { id: updatedUser.guestProfile.id },
            data: { bio: dto.bio ?? updatedUser.guestProfile.bio, city: dto.city ?? updatedUser.guestProfile.city, country: dto.country ?? updatedUser.guestProfile.country }
          })
        : await tx.guestProfile.create({ data: { userId, bio: dto.bio, city: dto.city, country: dto.country } });

      return { ...updatedUser, guestProfile };
    });
  }
}
