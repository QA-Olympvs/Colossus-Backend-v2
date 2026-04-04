import { IsBoolean, IsEnum, IsOptional, Matches } from 'class-validator';
import { DayOfWeek } from '../entities/branch-schedule.entity';

export class CreateBranchScheduleDto {
  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'open_time must be HH:MM format',
  })
  open_time?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'close_time must be HH:MM format',
  })
  close_time?: string;

  @IsBoolean()
  @IsOptional()
  is_closed?: boolean;
}
