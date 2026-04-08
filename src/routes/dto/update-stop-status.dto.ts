import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';

export class UpdateStopStatusDto {
  @IsEnum(['pending', 'completed', 'skipped'])
  @IsNotEmpty()
  status: string;

  // Current driver location; required by service when marking stop as completed.
  @IsOptional()
  @IsLatitude()
  current_latitude?: number;

  @IsOptional()
  @IsLongitude()
  current_longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  max_distance_m?: number;

  // Delivery photo URL - required if branch.requires_delivery_photo is true
  @IsOptional()
  @IsUrl()
  delivery_photo_url?: string;
}
