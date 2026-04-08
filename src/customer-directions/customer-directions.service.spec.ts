import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerDirectionsService } from './customer-directions.service';
import { CustomerDirection } from './entities/customer-direction.entity';
import { CreateCustomerDirectionDto } from './dto/create-customer-direction.dto';
import { NotFoundException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('CustomerDirectionsService', () => {
  let service: CustomerDirectionsService;
  let customerDirectionRepository: Partial<
    Record<keyof Repository<CustomerDirection>, MockedFunction<any>>
  >;

  const mockCustomerDirection: Partial<CustomerDirection> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customer_id: 'customer-123',
    street: 'Test Street 123',
    city: 'Mexico City',
    state: 'CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    is_default: false,
  };

  beforeEach(async () => {
    customerDirectionRepository = {
      create: vi.fn().mockReturnValue(mockCustomerDirection),
      save: vi.fn().mockResolvedValue(mockCustomerDirection),
      find: vi.fn().mockResolvedValue([mockCustomerDirection]),
      findOne: vi.fn().mockResolvedValue(mockCustomerDirection),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerDirectionsService,
        {
          provide: getRepositoryToken(CustomerDirection),
          useValue: customerDirectionRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerDirectionsService>(CustomerDirectionsService);
  });

  describe('create', () => {
    it('should create a new customer direction', async () => {
      const createDto = {
        customer_id: 'customer-123',
        street: 'Test Street 123',
        city: 'Mexico City',
        state: 'CDMX',
        latitude: 19.4326,
        longitude: -99.1332,
      };

      const result = await service.create(
        createDto as unknown as CreateCustomerDirectionDto,
      );

      expect(customerDirectionRepository.create!).toHaveBeenCalledWith(
        createDto,
      );
      expect(customerDirectionRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockCustomerDirection);
    });
  });

  describe('findAll', () => {
    it('should return all customer directions', async () => {
      const result = await service.findAll();

      expect(customerDirectionRepository.find!).toHaveBeenCalledWith({
        where: {},
        relations: ['customer'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockCustomerDirection]);
    });

    it('should filter by customer_id', async () => {
      await service.findAll('customer-123');

      expect(customerDirectionRepository.find!).toHaveBeenCalledWith({
        where: { customer_id: 'customer-123' },
        relations: ['customer'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer direction by id', async () => {
      const result = await service.findOne(mockCustomerDirection.id as string);

      expect(customerDirectionRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockCustomerDirection.id },
        relations: ['customer'],
      });
      expect(result).toEqual(mockCustomerDirection);
    });

    it('should throw NotFoundException if not found', async () => {
      customerDirectionRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer direction', async () => {
      const updateDto = {
        street: 'Updated Street 456',
        city: 'Guadalajara',
      };

      const updated = { ...mockCustomerDirection, ...updateDto };
      customerDirectionRepository.save!.mockResolvedValue(updated);

      const result = await service.update(
        mockCustomerDirection.id as string,
        updateDto,
      );

      expect(customerDirectionRepository.save!).toHaveBeenCalled();
      expect(result.street).toBe('Updated Street 456');
      expect(result.city).toBe('Guadalajara');
    });
  });

  describe('remove', () => {
    it('should delete a customer direction', async () => {
      await service.remove(mockCustomerDirection.id as string);

      expect(customerDirectionRepository.remove!).toHaveBeenCalledWith(
        mockCustomerDirection,
      );
    });
  });
});
