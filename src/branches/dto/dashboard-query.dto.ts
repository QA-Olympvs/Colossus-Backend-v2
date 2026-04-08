import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month';
}
