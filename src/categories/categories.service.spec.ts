import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { NotFoundException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: Partial<
    Record<keyof Repository<Category>, MockedFunction<any>>
  >;

  const mockCategory: Partial<Category> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Category',
    sort_order: 1,
    is_active: true,
    branch_id: 'branch-123',
  };

  beforeEach(async () => {
    categoryRepository = {
      create: vi.fn().mockReturnValue(mockCategory),
      save: vi.fn().mockResolvedValue(mockCategory),
      find: vi.fn().mockResolvedValue([mockCategory]),
      findOne: vi.fn().mockResolvedValue(mockCategory),
      remove: vi.fn().mockResolvedValue(undefined),
      manager: {
        transaction: vi.fn(async (callback) => {
          const manager = {
            update: vi.fn().mockResolvedValue(undefined),
          };
          return callback(manager);
        }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('should create a new category successfully', async () => {
      const createCategoryDto = {
        name: 'Test Category',
        branch_id: 'branch-123',
      };

      const result = await service.create(createCategoryDto);

      expect(categoryRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(categoryRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should auto-assign sort_order if not provided', async () => {
      categoryRepository.findOne!.mockResolvedValueOnce({ sort_order: 5 });

      const createCategoryDto = {
        name: 'New Category',
        branch_id: 'branch-123',
      };

      await service.create(createCategoryDto);

      expect(categoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ sort_order: 6 }),
      );
    });

    it('should start sort_order at 1 if no categories exist', async () => {
      categoryRepository.findOne!.mockResolvedValueOnce(null);

      const createCategoryDto = {
        name: 'First Category',
        branch_id: 'branch-123',
      };

      await service.create(createCategoryDto);

      expect(categoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ sort_order: 1 }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all active categories', async () => {
      const result = await service.findAll();

      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['children', 'parent', 'branch'],
        order: { sort_order: 'ASC', name: 'ASC' },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by branch_id when provided', async () => {
      await service.findAll('branch-123');

      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { is_active: true, branch_id: 'branch-123' },
        relations: ['children', 'parent', 'branch'],
        order: { sort_order: 'ASC', name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const result = await service.findOne(mockCategory.id as string);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        relations: ['parent', 'children', 'products'],
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const updateCategoryDto = {
        name: 'Updated Category',
        sort_order: 2,
      };

      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      categoryRepository.save!.mockResolvedValue(updatedCategory);

      const result = await service.update(
        mockCategory.id as string,
        updateCategoryDto,
      );

      expect(categoryRepository.save!).toHaveBeenCalled();
      expect(result.name).toBe('Updated Category');
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      await service.remove(mockCategory.id as string);

      expect(categoryRepository.remove!).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('reorderCategories', () => {
    it('should reorder categories in a transaction', async () => {
      const categories = [
        { id: 'cat-1', sort_order: 1 },
        { id: 'cat-2', sort_order: 2 },
        { id: 'cat-3', sort_order: 3 },
      ];

      await service.reorderCategories(categories);

      expect(categoryRepository.manager!.transaction).toHaveBeenCalled();
    });
  });
});
