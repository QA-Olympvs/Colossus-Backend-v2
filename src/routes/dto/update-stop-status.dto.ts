import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStopStatusDto {
  @IsEnum(['pending', 'completed', 'skipped'])
  @IsNotEmpty()
  status: string;
}
