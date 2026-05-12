import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    type: 'string',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    type: 'string',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'newuser@mitienda.com',
    type: 'string',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
    type: 'string',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'Password123!',
    type: 'string',
    format: 'password',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Whether user is the owner of the business',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  is_owner?: boolean;

  // Datos de la sucursal principal (solo aplica al primer usuario)
  @ApiPropertyOptional({
    description: 'Branch name (only for first user)',
    example: 'Sucursal Principal',
    type: 'string',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  branch_name?: string;

  @ApiPropertyOptional({
    description: 'Branch address (only for first user)',
    example: 'Calle Principal #123',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  branch_address?: string;

  @ApiPropertyOptional({
    description: 'Branch phone (only for first user)',
    example: '+1234567890',
    type: 'string',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  branch_phone?: string;

  @ApiPropertyOptional({
    description: 'Branch email (only for first user)',
    example: 'branch@mitienda.com',
    type: 'string',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  branch_email?: string;

  @ApiPropertyOptional({
    description: 'Branch RFC (only for first user)',
    example: 'ABC123456XYZ',
    type: 'string',
    maxLength: 13,
  })
  @IsString()
  @IsOptional()
  @MaxLength(13)
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'RFC format is invalid',
  })
  branch_rfc?: string;

  @ApiPropertyOptional({
    description: 'Branch latitude (only for first user)',
    example: 19.4326,
    type: 'number',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  branch_latitude?: number;

  @ApiPropertyOptional({
    description: 'Branch longitude (only for first user)',
    example: -99.1332,
    type: 'number',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  branch_longitude?: number;
}
