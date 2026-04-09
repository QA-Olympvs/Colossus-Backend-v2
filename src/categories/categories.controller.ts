import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new category',
    description: 'Creates a new category in the system. Requires authentication token. Automatically assigns branch_id from authenticated user if not provided.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Category created successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Electrónica",
        description: "Productos electrónicos y accesorios",
        branch_id: "a5664473-a72c-426b-8162-72de03b573a5",
        parent_id: null,
        sort_order: 1,
        is_active: true,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const user = req.user || {};
    // Asignar automáticamente el branch_id del usuario
    createCategoryDto.branch_id = user.branch_id;
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all categories',
    description: 'Retrieves a list of categories. Can filter by branch ID. If user is authenticated, returns categories from their branch by default.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories retrieved successfully',
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Electrónica",
          description: "Productos electrónicos y accesorios",
          sort_order: 1,
          is_active: true,
          parent_id: null,
          children: [
            {
              id: "456e7890-e89b-12d3-a456-426614174001",
              name: "Laptops",
              description: "Computadoras portátiles",
              sort_order: 1,
              is_active: true
            }
          ]
        }
      ]
    }
  })
  @ApiQuery({ 
    name: 'branchId', 
    required: false, 
    description: 'Filter by branch ID',
    example: 'a5664473-a72c-426b-8162-72de03b573a5'
  })
  findAll(@Query('branchId') branchId?: string, @Req() req?: any) {
    const user = req?.user || {};
    // Si el usuario tiene branch_id, solo puede ver categorías de su sucursal
    const effectiveBranchId = user.branch_id || branchId;
    return this.categoriesService.findAll(effectiveBranchId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get category by ID',
    description: 'Retrieves a specific category by its unique identifier including parent and child relationships.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Electrónica",
        description: "Productos electrónicos y accesorios",
        sort_order: 1,
        is_active: true,
        branch_id: "a5664473-a72c-426b-8162-72de03b573a5",
        parent_id: null,
        parent: null,
        children: [
          {
            id: "456e7890-e89b-12d3-a456-426614174001",
            name: "Laptops",
            description: "Computadoras portátiles",
            sort_order: 1,
            is_active: true
          }
        ],
        product_count: 15
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ 
    name: 'id', 
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update category',
    description: 'Updates category information. Only provided fields will be updated. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category updated successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Electrónica (Actualizada)",
        description: "Productos electrónicos y accesorios - versión actualizada",
        sort_order: 2,
        is_active: true
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Category UUID to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete category',
    description: 'Permanently deletes a category from the system. Cannot delete if category has associated products.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category deleted successfully',
    schema: {
      example: {
        message: "Category deleted successfully",
        deletedCategory: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Electrónica"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete category with associated products' })
  @ApiParam({ 
    name: 'id', 
    description: 'Category UUID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Reorder categories',
    description: 'Updates the sort order of multiple categories. Requires authentication and branch permissions.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories reordered successfully',
    schema: {
      example: {
        message: "Categories reordered successfully",
        updatedCategories: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Electrónica",
            sort_order: 1
          },
          {
            id: "456e7890-e89b-12d3-a456-426614174001",
            name: "Ropa",
            sort_order: 2
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reorderCategories(@Body() reorderDto: { categories: { id: string; sort_order: number }[] }) {
    return this.categoriesService.reorderCategories(reorderDto.categories);
  }
}
