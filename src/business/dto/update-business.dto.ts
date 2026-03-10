import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
