import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../common/prisma.service';
import { MeController } from './me.controller';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService, PrismaService],
  exports: [UsersService]
})
export class UsersModule {}
