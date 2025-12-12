import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.usersService.getMe(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/role')
  setRole(@CurrentUser() user: any, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(user.userId, dto.role);
  }

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
