import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { MockedFunction } from 'vitest';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepository: Partial<
    Record<keyof Repository<Customer>, MockedFunction<any>>
  >;

  const mockCustomer: Partial<Customer> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    is_registered: true,
  };

  beforeEach(async () => {
    customerRepository = {
      create: vi.fn().mockReturnValue(mockCustomer),
      save: vi.fn().mockResolvedValue(mockCustomer),
      find: vi.fn().mockResolvedValue([mockCustomer]),
      findOne: vi.fn().mockResolvedValue(mockCustomer),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('create', () => {
    it('should create a new customer successfully', async () => {
      const createCustomerDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const result = await service.create(createCustomerDto);

      expect(customerRepository.create).toHaveBeenCalledWith(createCustomerDto);
      expect(customerRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });

    it('should throw ConflictException if user already has customer record', async () => {
      customerRepository.findOne!.mockResolvedValue(mockCustomer);

      const createCustomerDto = {
        first_name: 'John',
        last_name: 'Doe',
        user_id: 'existing-user-id',
      };

      await expect(
        service.create(createCustomerDto as unknown as CreateCustomerDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      const result = await service.findAll();

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['user', 'directions'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockCustomer]);
    });

    it('should filter by user_id', async () => {
      await service.findAll('user-123');

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        relations: ['user', 'directions'],
        order: { created_at: 'DESC' },
      });
    });

    it('should filter by is_registered', async () => {
      await service.findAll(undefined, true);

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: { is_registered: true },
        relations: ['user', 'directions'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const result = await service.findOne(mockCustomer.id as string);

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        relations: ['user', 'directions'],
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer successfully', async () => {
      const updateCustomerDto = {
        first_name: 'Jane',
        phone: '0987654321',
      };

      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto };
      customerRepository.save!.mockResolvedValue(updatedCustomer);

      const result = await service.update(
        mockCustomer.id as string,
        updateCustomerDto,
      );

      expect(customerRepository.save).toHaveBeenCalled();
      expect(result.first_name).toBe('Jane');
    });

    it('should throw ConflictException if new user_id already has customer', async () => {
      const existingCustomer = { id: 'other-customer', user_id: 'new-user' };
      customerRepository
        .findOne!.mockResolvedValueOnce(mockCustomer) // For findOne in update
        .mockResolvedValueOnce(existingCustomer); // For user_id check

      const updateCustomerDto = {
        user_id: 'new-user',
      };

      await expect(
        service.update(mockCustomer.id as string, updateCustomerDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      await service.remove(mockCustomer.id as string);

      expect(customerRepository.remove).toHaveBeenCalledWith(mockCustomer);
    });
  });
});
