import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { NotFoundException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Partial<
    Record<keyof Repository<Product>, MockedFunction<any>>
  >;

  const mockProduct: Partial<Product> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    is_active: true,
    branch_id: 'branch-123',
  };

  beforeEach(async () => {
    productRepository = {
      create: vi.fn().mockReturnValue(mockProduct),
      save: vi.fn().mockResolvedValue(mockProduct),
      find: vi.fn().mockResolvedValue([mockProduct]),
      findOne: vi.fn().mockResolvedValue(mockProduct),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        branch_id: 'branch-123',
        category_id: 'category-123',
      };

      const result = await service.create(createProductDto as any);

      expect(productRepository.create!).toHaveBeenCalledWith(createProductDto);
      expect(productRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return all active products', async () => {
      const result = await service.findAll();

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['category', 'branch'],
      });
      expect(result).toEqual([mockProduct]);
    });

    it('should filter by business_id when provided', async () => {
      await service.findAll('business-123');

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { is_active: true, business_id: 'business-123' },
        relations: ['category', 'branch'],
      });
    });

    it('should filter by branch_id when provided', async () => {
      await service.findAll(undefined, 'branch-123');

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { is_active: true, branch_id: 'branch-123' },
        relations: ['category', 'branch'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne(mockProduct.id as string);

      expect(productRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        relations: ['business', 'branch', 'category'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateProductDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      const result = await service.findOne(mockProduct.id as string);
      productRepository.save!.mockResolvedValue({
        ...mockProduct,
        ...updateProductDto,
      });

      const updatedResult = await service.update(
        mockProduct.id as string,
        updateProductDto,
      );

      expect(productRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      await service.remove(mockProduct.id as string);

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });
});
