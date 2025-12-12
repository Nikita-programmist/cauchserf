import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlacesModule } from './places/places.module';
import { StaysModule } from './stays/stays.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PlacesModule,
    StaysModule,
    ChatModule,
    ReviewsModule,
    HealthModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
