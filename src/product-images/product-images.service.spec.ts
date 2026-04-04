import { Test, TestingModule } from '@nestjs/testing';
import { ProductImagesService } from './product-images.service';
import { ProductsService } from '@/products/products.service';
import * as s3Client from '@/storage/s3-client';
import { NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ProductImagesService', () => {
  let service: ProductImagesService;
  let productsService: { findOne: ReturnType<typeof vi.fn> };

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Product',
    image_url: null,
  };

  const mockPresignedUrl =
    'https://s3.amazonaws.com/test-bucket/products/test.jpg?X-Amz-Signature=xxx';

  beforeEach(async () => {
    productsService = {
      findOne: vi.fn(),
    };

    vi.spyOn(s3Client, 'generateUploadUrl').mockResolvedValue(mockPresignedUrl);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImagesService,
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    }).compile();

    service = module.get<ProductImagesService>(ProductImagesService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('should generate presigned URL for existing product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await service.generateUploadUrl(mockProduct.id);

      expect(result).toHaveProperty('presigned_url', mockPresignedUrl);
      expect(result).toHaveProperty('file_key');
      expect(result.file_key).toMatch(
        new RegExp(`products/${mockProduct.id}/\\d+\\.jpg`),
      );
      expect(result).toHaveProperty('expires_in', 300);
      expect(productsService.findOne).toHaveBeenCalledWith(mockProduct.id);
      expect(s3Client.generateUploadUrl).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productsService.findOne.mockResolvedValue(null);

      await expect(
        service.generateUploadUrl('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use custom expiry from environment variable', async () => {
      const originalEnv = process.env.S3_PRESIGNED_URL_EXPIRY;
      process.env.S3_PRESIGNED_URL_EXPIRY = '600';

      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await service.generateUploadUrl(mockProduct.id);

      expect(result.expires_in).toBe(600);

      process.env.S3_PRESIGNED_URL_EXPIRY = originalEnv;
    });

    it('should generate unique file keys for same product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result1 = await service.generateUploadUrl(mockProduct.id);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const result2 = await service.generateUploadUrl(mockProduct.id);

      expect(result1.file_key).not.toBe(result2.file_key);
    });
  });
});
