import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(13)
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'RFC format is invalid',
  })
  rfc?: string;

  @IsBoolean()
  @IsOptional()
  is_accepting_orders?: boolean;

  @IsBoolean()
  @IsOptional()
  has_delivery?: boolean;

  @IsBoolean()
  @IsOptional()
  has_pickup?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_min_amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_radius_km?: number;

  @IsBoolean()
  @IsOptional()
  requires_delivery_photo?: boolean;
}
