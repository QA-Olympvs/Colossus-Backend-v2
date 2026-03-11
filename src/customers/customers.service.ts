import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    if (createCustomerDto.user_id) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { user_id: createCustomerDto.user_id },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `User #${createCustomerDto.user_id} already has a customer record`,
        );
      }
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(userId?: string, isRegistered?: boolean): Promise<Customer[]> {
    const where: Record<string, unknown> = {};
    if (userId) where.user_id = userId;
    if (typeof isRegistered === 'boolean') where.is_registered = isRegistered;

    return this.customerRepository.find({
      where,
      relations: ['user', 'directions'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['user', 'directions'],
    });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    if (
      updateCustomerDto.user_id &&
      updateCustomerDto.user_id !== customer.user_id
    ) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { user_id: updateCustomerDto.user_id },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `User #${updateCustomerDto.user_id} already has a customer record`,
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }
}
