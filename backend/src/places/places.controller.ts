import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('places')
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Get()
  list(
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('guests') guests?: string
  ) {
    return this.placesService.list({ city, country, guests: guests ? Number(guests) : undefined });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.placesService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePlaceDto) {
    return this.placesService.create(user.userId, dto);
  }
}
