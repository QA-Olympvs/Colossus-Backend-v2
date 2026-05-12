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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiPropertyOptional({
    description:
      "Branch ID where the product belongs. If not provided, uses the authenticated user's branch.",
    example: 'a5664473-a72c-426b-8162-72de03b573a5',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @ApiProperty({
    description: 'Category ID where the product belongs',
    example: '9ad65e65-e8e6-481e-98f1-0b73f9585019',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({
    description: 'Product name (must be unique within the category)',
    example: 'Laptop Dell XPS 15',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example:
      'High-performance laptop with 16GB RAM, 512GB SSD, and Intel Core i7 processor',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product SKU (Stock Keeping Unit) for inventory tracking',
    example: 'DELL-XPS15-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({
    description: 'Product price (must be greater than or equal to 0)',
    example: 1299.99,
    minimum: 0,
    type: 'number',
    format: 'float',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  price: number;

  @ApiPropertyOptional({
    description: 'Current stock quantity (must be greater than or equal to 0)',
    example: 10,
    minimum: 0,
    type: 'integer',
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  stock?: number;

  @ApiPropertyOptional({
    description: 'URL of the product image',
    example: 'https://example.com/images/laptop-dell-xps15.jpg',
    format: 'url',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}
