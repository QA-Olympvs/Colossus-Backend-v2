import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Si no se especifica sort_order, asignar automáticamente el siguiente consecutivo
    if (!createCategoryDto.sort_order) {
      const whereCondition: any = {
        branch_id: createCategoryDto.branch_id,
      };

      if (createCategoryDto.parent_id) {
        whereCondition.parent_id = createCategoryDto.parent_id;
      } else {
        whereCondition.parent_id = null;
      }

      const lastCategory = await this.categoryRepository.findOne({
        where: whereCondition,
        order: { sort_order: 'DESC' },
      });

      createCategoryDto.sort_order = lastCategory
        ? lastCategory.sort_order + 1
        : 1;
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(branchId?: string): Promise<Category[]> {
    const where: Record<string, unknown> = { is_active: true };
    if (branchId) where.branch_id = branchId;
    return this.categoryRepository.find({
      where,
      relations: ['children', 'parent', 'branch'],
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async reorderCategories(
    categories: { id: string; sort_order: number }[],
  ): Promise<void> {
    await this.categoryRepository.manager.transaction(async (manager) => {
      for (const { id, sort_order } of categories) {
        await manager.update(Category, id, { sort_order });
      }
    });
  }
}
