import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteStopDto {
  @IsUUID()
  @IsOptional()
  customer_direction_id?: string;

  // TODO: Uncomment when orders module is implemented
  // @IsUUID()
  // @IsOptional()
  // order_id?: string;

  @IsInt()
  @Min(1)
  stop_order: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class CreateRouteDto {
  @IsUUID()
  @IsNotEmpty()
  business_id: string;

  @IsUUID()
  @IsOptional()
  assigned_user_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops: CreateRouteStopDto[];
}
