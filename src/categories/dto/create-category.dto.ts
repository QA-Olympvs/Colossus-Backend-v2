import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  branch_id: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  sort_order?: number;
}
