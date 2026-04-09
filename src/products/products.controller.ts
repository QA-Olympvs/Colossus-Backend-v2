import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new product',
    description: 'Creates a new product in the system. Requires authentication token.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Laptop Dell XPS 15",
        description: "High-performance laptop with 16GB RAM",
        price: 1299.99,
        stock: 10,
        category_id: "456e7890-e89b-12d3-a456-426614174000",
        sku: "DELL-XPS15-001",
        image_url: "https://example.com/laptop.jpg",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    // Asignar automáticamente el branch_id del usuario si no se proporciona
    if (!createProductDto.branch_id && req.user?.branch_id) {
      createProductDto.branch_id = req.user.branch_id;
    }
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all products',
    description: 'Retrieves a list of products. Can filter by business ID and/or branch ID.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Products retrieved successfully',
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Laptop Dell XPS 15",
          price: 1299.99,
          stock: 10,
          category: {
            id: "456e7890-e89b-12d3-a456-426614174000",
            name: "Electrónica"
          }
        }
      ]
    }
  })
  @ApiQuery({ 
    name: 'businessId', 
    required: false, 
    description: 'Filter by business ID',
    example: 'business-uuid-here'
  })
  @ApiQuery({ 
    name: 'branchId', 
    required: false, 
    description: 'Filter by branch ID',
    example: 'branch-uuid-here'
  })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('branchId') branchId?: string,
    @Req() req?: any,
  ) {
    // Si no se proporcionan filtros, usar los del usuario autenticado
    const user = req?.user || {};
    const effectiveBusinessId = businessId || user.business_id;
    const effectiveBranchId = branchId || user.branch_id;
    
    return this.productsService.findAll(effectiveBusinessId, effectiveBranchId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get product by ID',
    description: 'Retrieves a specific product by its unique identifier.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Product retrieved successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Laptop Dell XPS 15",
        description: "High-performance laptop with 16GB RAM",
        price: 1299.99,
        stock: 10,
        category: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          name: "Electrónica"
        },
        sku: "DELL-XPS15-001",
        image_url: "https://example.com/laptop.jpg"
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ 
    name: 'id', 
    description: 'Product UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update product',
    description: 'Updates product information. Only provided fields will be updated.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Laptop Dell XPS 15 (Updated)",
        price: 1199.99,
        stock: 8
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Product UUID to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete product',
    description: 'Permanently deletes a product from the system.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: "Product deleted successfully",
        deletedProduct: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Laptop Dell XPS 15"
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ 
    name: 'id', 
    description: 'Product UUID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
