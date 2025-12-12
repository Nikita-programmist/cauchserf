import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class OnboardingDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
