import { Module } from '@nestjs/common';
import { StaysService } from './stays.service';
import { StaysController } from './stays.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [StaysController],
  providers: [StaysService, PrismaService],
  exports: [StaysService]
})
export class StaysModule {}
