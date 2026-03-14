import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  is_owner?: boolean;

  // Datos de la sucursal principal (solo aplica al primer usuario)
  @IsString()
  @IsOptional()
  @MaxLength(150)
  branch_name?: string;

  @IsString()
  @IsOptional()
  branch_address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  branch_phone?: string;

  @IsEmail()
  @IsOptional()
  branch_email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(13)
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, { message: 'RFC format is invalid' })
  branch_rfc?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  branch_latitude?: number;

  @IsNumber()
  @IsOptional()
  branch_longitude?: number;
}
