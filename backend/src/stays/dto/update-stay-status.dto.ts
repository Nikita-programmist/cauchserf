import { IsEnum } from 'class-validator';

export enum StayStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export class UpdateStayStatusDto {
  @IsEnum(StayStatus)
  status!: StayStatus;
}
