import { IsString, IsUUID } from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID()
  product_id: string;

  @IsString()
  file_key: string;
}
