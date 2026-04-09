import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Branch ID where the category belongs',
    example: 'a5664473-a72c-426b-8162-72de03b573a5',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  branch_id: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for subcategories',
    example: '9ad65e65-e8e6-481e-98f1-0b73f9585019',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Electrónica',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Productos electrónicos y accesorios',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  sort_order?: number;
}
