import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OnboardingDto } from './dto/onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller(['me', 'api/me'])
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUser() user: any) {
    return this.usersService.getMe(user.userId);
  }

  @Post('onboarding')
  completeOnboarding(@CurrentUser() user: any, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.userId, dto.role);
  }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
