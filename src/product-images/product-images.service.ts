import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '@/products/products.service';
import { Product } from '@/products/entities/product.entity';
import { generateUploadUrl, getPublicUrl } from '@/storage/s3-client';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';

@Injectable()
export class ProductImagesService {
  constructor(private readonly productsService: ProductsService) {}

  async generateUploadUrl(productId: string): Promise<PresignedUrlResponseDto> {
    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Generate file key
    const timestamp = Date.now();
    const fileKey = `products/${productId}/${timestamp}.jpg`;

    // Get expiry from env or default to 300s (5 minutes)
    const expiresIn = parseInt(
      process.env.S3_PRESIGNED_URL_EXPIRY || '300',
      10,
    );

    // Generate presigned URL
    const presignedUrl = await generateUploadUrl(fileKey, expiresIn);

    return {
      presigned_url: presignedUrl,
      file_key: fileKey,
      expires_in: expiresIn,
    };
  }

  async confirmUpload(productId: string, fileKey: string): Promise<Product> {
    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Generate public URL
    const imageUrl = getPublicUrl(fileKey);

    // Update product with new image URL
    return this.productsService.update(productId, { image_url: imageUrl });
  }
}
