import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import * as s3Client from './s3-client';
import { MockedFunction } from 'vitest';

// Mock s3-client
vi.mock('./s3-client', () => ({
  generateUploadUrl: vi.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('should generate upload URL with correct parameters', async () => {
      const mockPresignedUrl =
        'https://s3.amazonaws.com/bucket/deliveries/order-123/1234567890.jpg?signature=xyz';
      (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mockResolvedValue(mockPresignedUrl);

      const orderId = 'order-123';
      const result = await service.generateUploadUrl(orderId);

      // Verify S3 client was called
      expect(s3Client.generateUploadUrl).toHaveBeenCalled();

      // Check the file key pattern
      const fileKeyArg = (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mock.calls[0][0];
      expect(fileKeyArg).toMatch(
        new RegExp(`deliveries/${orderId}/\\d+\\.jpg`),
      );

      // Verify response structure
      expect(result).toHaveProperty('presigned_url', mockPresignedUrl);
      expect(result).toHaveProperty('file_key');
      expect(result).toHaveProperty('expires_in');
      expect(result.file_key).toMatch(
        new RegExp(`deliveries/${orderId}/\\d+\\.jpg`),
      );
    });

    it('should use default expiry of 300 seconds', async () => {
      (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mockResolvedValue('https://example.com');

      // Clear env variable
      delete process.env.S3_PRESIGNED_URL_EXPIRY;

      await service.generateUploadUrl('order-123');

      const expiresInArg = (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mock.calls[0][1];
      expect(expiresInArg).toBe(300);
    });

    it('should use custom expiry from environment variable', async () => {
      (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mockResolvedValue('https://example.com');

      process.env.S3_PRESIGNED_URL_EXPIRY = '600';

      await service.generateUploadUrl('order-123');

      const expiresInArg = (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mock.calls[0][1];
      expect(expiresInArg).toBe(600);

      // Clean up
      delete process.env.S3_PRESIGNED_URL_EXPIRY;
    });

    it('should return unique file keys for multiple calls', async () => {
      (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mockResolvedValue('https://example.com');

      const result1 = await service.generateUploadUrl('order-123');

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await service.generateUploadUrl('order-123');

      expect(result1.file_key).not.toBe(result2.file_key);
    });

    it('should handle different order IDs', async () => {
      (
        s3Client.generateUploadUrl as unknown as MockedFunction<
          typeof s3Client.generateUploadUrl
        >
      ).mockResolvedValue('https://example.com');

      const result1 = await service.generateUploadUrl('order-123');
      const result2 = await service.generateUploadUrl('order-456');

      expect(result1.file_key).toContain('order-123');
      expect(result2.file_key).toContain('order-456');
    });
  });
});
