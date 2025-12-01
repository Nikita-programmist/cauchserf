import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaysService } from './stays.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateStayDto } from './dto/create-stay.dto';
import { UpdateStayStatusDto } from './dto/update-stay-status.dto';

@Controller('stays')
@UseGuards(JwtAuthGuard)
export class StaysController {
  constructor(private staysService: StaysService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStayDto) {
    return this.staysService.create(user.userId, dto);
  }

  @Get('my')
  my(@CurrentUser() user: any) {
    return this.staysService.listForGuest(user.userId);
  }

  @Get('host')
  host(@CurrentUser() user: any) {
    return this.staysService.listForHost(user.userId);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateStayStatusDto) {
    return this.staysService.updateStatus(user.userId, id, dto.status);
  }
}
