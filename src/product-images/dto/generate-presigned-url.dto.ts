import { IsUUID, IsNotEmpty } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;
}
