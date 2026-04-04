import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  icon: string;

  @IsString()
  @IsNotEmpty()
  route: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  is_delivery_module?: boolean;

  @IsString()
  @IsOptional()
  parent_module_id?: string;
}
