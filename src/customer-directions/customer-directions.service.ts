import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDirection } from './entities/customer-direction.entity';
import { CreateCustomerDirectionDto } from './dto/create-customer-direction.dto';
import { UpdateCustomerDirectionDto } from './dto/update-customer-direction.dto';

@Injectable()
export class CustomerDirectionsService {
  constructor(
    @InjectRepository(CustomerDirection)
    private readonly customerDirectionRepository: Repository<CustomerDirection>,
  ) {}

  async create(
    createCustomerDirectionDto: CreateCustomerDirectionDto,
  ): Promise<CustomerDirection> {
    const customerDirection = this.customerDirectionRepository.create(
      createCustomerDirectionDto,
    );
    return this.customerDirectionRepository.save(customerDirection);
  }

  async findAll(customerId?: string): Promise<CustomerDirection[]> {
    const where: Record<string, unknown> = {};
    if (customerId) where.customer_id = customerId;

    return this.customerDirectionRepository.find({
      where,
      relations: ['customer'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerDirection> {
    const customerDirection = await this.customerDirectionRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!customerDirection)
      throw new NotFoundException(`Customer direction #${id} not found`);
    return customerDirection;
  }

  async update(
    id: string,
    updateCustomerDirectionDto: UpdateCustomerDirectionDto,
  ): Promise<CustomerDirection> {
    const customerDirection = await this.findOne(id);
    Object.assign(customerDirection, updateCustomerDirectionDto);
    return this.customerDirectionRepository.save(customerDirection);
  }

  async remove(id: string): Promise<void> {
    const customerDirection = await this.findOne(id);
    await this.customerDirectionRepository.remove(customerDirection);
  }
}
