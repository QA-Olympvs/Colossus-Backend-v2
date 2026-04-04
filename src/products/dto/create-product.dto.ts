import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  price: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  stock?: number;

  @IsString()
  @IsOptional()
  image_url?: string;
}
