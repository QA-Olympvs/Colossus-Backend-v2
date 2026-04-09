import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductImagesService } from './product-images.service';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { Product } from '@/products/entities/product.entity';

@ApiTags('product-images')
@Controller('product-images')
@UseGuards(AuthGuard('jwt'))
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.productImagesService.generateUploadUrl(dto.product_id);
  }

  @Post('confirm-upload')
  async confirmUpload(@Body() dto: ConfirmUploadDto): Promise<Product> {
    return this.productImagesService.confirmUpload(
      dto.product_id,
      dto.file_key,
    );
  }
}
