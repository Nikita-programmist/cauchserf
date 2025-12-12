import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name ?? dto.email.split('@')[0]
      }
    });
    return this.buildAuthResponse(user.id, user.email, user.name ?? null, user.role ?? null);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Пользователь не найден',
        code: 'USER_NOT_FOUND'
      });
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Неверный пароль',
        code: 'INVALID_PASSWORD'
      });
    }
    return this.buildAuthResponse(user.id, user.email, user.name ?? null, user.role ?? null);
  }

  private buildAuthResponse(id: string, email: string, name: string | null, role: UserRole | null) {
    const token = this.jwt.sign({ sub: id, email });
    return { token, user: { id, email, name, role } };
  }
}
