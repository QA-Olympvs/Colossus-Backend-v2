import { Controller, Post, Body } from '@nestjs/common';
import { StorageService } from './storage.service';
import {
  GetPresignedUrlDto,
  PresignedUrlResponseDto,
} from './dto/presigned-url.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @Body() dto: GetPresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.storageService.generateUploadUrl(dto.order_id);
  }
}
