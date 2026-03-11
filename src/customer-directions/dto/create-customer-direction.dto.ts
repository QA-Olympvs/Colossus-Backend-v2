import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDirectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipient_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ext_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  int_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  neighborhood?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postal_code: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  country?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
