import { IsString, IsNotEmpty } from 'class-validator';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  order_id: string;
}

export class PresignedUrlResponseDto {
  presigned_url: string;
  file_key: string;
  expires_in: number;
}
