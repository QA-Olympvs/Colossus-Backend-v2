import { Injectable } from '@nestjs/common';
import { generateUploadUrl } from './s3-client';

@Injectable()
export class StorageService {
  async generateUploadUrl(orderId: string): Promise<{
    presigned_url: string;
    file_key: string;
    expires_in: number;
  }> {
    const timestamp = Date.now();
    const fileKey = `deliveries/${orderId}/${timestamp}.jpg`;
    const expiresIn = parseInt(
      process.env.S3_PRESIGNED_URL_EXPIRY || '300',
      10,
    );

    const presignedUrl = await generateUploadUrl(fileKey, expiresIn);

    return {
      presigned_url: presignedUrl,
      file_key: fileKey,
      expires_in: expiresIn,
    };
  }
}
