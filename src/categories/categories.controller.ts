import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const user = req.user || {};
    // Asignar automáticamente el branch_id del usuario
    createCategoryDto.branch_id = user.branch_id;
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any, @Query('branchId') branchId?: string) {
    const user = req.user || {};
    // Si el usuario tiene branch_id, solo puede ver categorías de su sucursal
    const effectiveBranchId = user.branch_id || branchId;
    return this.categoriesService.findAll(effectiveBranchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  async reorderCategories(@Body() reorderDto: { categories: { id: string; sort_order: number }[] }) {
    return this.categoriesService.reorderCategories(reorderDto.categories);
  }
}
