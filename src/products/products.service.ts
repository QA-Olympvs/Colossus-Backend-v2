import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    if (savedProduct.branch_id) {
      this.eventEmitter.emit('product.created', {
        branchId: savedProduct.branch_id,
        product: {
          id: savedProduct.id,
          branch_id: savedProduct.branch_id,
          name: savedProduct.name,
          price: savedProduct.price,
          is_active: savedProduct.is_active,
        },
      });
    }

    return savedProduct;
  }

  async findAll(businessId?: string, branchId?: string): Promise<Product[]> {
    const where: Record<string, unknown> = { is_active: true };
    if (businessId) where.business_id = businessId;
    if (branchId) where.branch_id = branchId;
    return this.productRepository.find({
      where,
      relations: ['category', 'branch'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['branch', 'category'],
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    const savedProduct = await this.productRepository.save(product);

    if (savedProduct.branch_id) {
      this.eventEmitter.emit('product.updated', {
        branchId: savedProduct.branch_id,
        product: {
          id: savedProduct.id,
          branch_id: savedProduct.branch_id,
          name: savedProduct.name,
          price: savedProduct.price,
          is_active: savedProduct.is_active,
        },
      });
    }

    return savedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.is_active = false;
    await this.productRepository.save(product);

    if (product.branch_id) {
      this.eventEmitter.emit('product.deleted', {
        branchId: product.branch_id,
        productId: product.id,
      });
    }
  }
}
