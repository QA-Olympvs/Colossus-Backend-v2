import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsBoolean()
  @IsOptional()
  is_registered?: boolean;

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
  @MaxLength(150)
  email: string;
}
