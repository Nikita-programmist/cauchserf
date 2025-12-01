import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateStayDto {
  @IsString()
  placeId!: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
