import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'Branch ID where the user belongs',
    example: 'a5664473-a72c-426b-8162-72de03b573a5',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  branch_id?: string;

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
    description: 'User phone number',
    example: '+1234567890',
    type: 'string',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Whether user is the owner of the business',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  is_owner?: boolean;
}
