import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateRouteStatusDto {
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  @IsNotEmpty()
  status: string;
}
