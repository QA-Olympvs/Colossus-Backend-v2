import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { MockedFunction } from 'vitest';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Partial<
    Record<keyof Repository<Order>, MockedFunction<any>>
  >;
  let orderItemRepository: Partial<
    Record<keyof Repository<OrderItem>, MockedFunction<any>>
  >;
  let paymentRepository: Partial<
    Record<keyof Repository<Payment>, MockedFunction<any>>
  >;

  const mockOrder: Partial<Order> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    order_number: 'ORD-TEST123',
    status: OrderStatus.PENDING,
    subtotal: 100,
    total: 100,
    branch_id: 'branch-123',
    customer_id: 'customer-123',
    items: [],
    payments: [],
    is_archived: false,
  };

  beforeEach(async () => {
    orderRepository = {
      create: vi.fn().mockReturnValue(mockOrder),
      save: vi.fn().mockResolvedValue(mockOrder),
      find: vi.fn().mockResolvedValue([mockOrder]),
      findOne: vi.fn().mockResolvedValue(mockOrder),
    };

    orderItemRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue([]),
    };

    paymentRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    it('should create a new order with items', async () => {
      const createOrderDto = {
        branch_id: 'branch-123',
        customer_id: 'customer-123',
        items: [
          {
            product_id: 'product-1',
            unit_price: 50,
            quantity: 2,
          },
        ],
      };

      const result = await service.create(createOrderDto);

      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(orderItemRepository.create).toHaveBeenCalled();
      expect(orderItemRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should throw BadRequestException if no items provided', async () => {
      const createOrderDto = {
        branch_id: 'branch-123',
        items: [],
      };

      await expect(
        service.create(createOrderDto as CreateOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate totals correctly', async () => {
      const createOrderDto = {
        branch_id: 'branch-123',
        customer_id: 'customer-123',
        items: [
          {
            product_id: 'p1',
            unit_price: 50,
            quantity: 2,
            discount_amount: 10,
          },
          { product_id: 'p2', unit_price: 30, quantity: 1 },
        ],
        discount_amount: 5,
        tax_amount: 8,
        delivery_fee: 10,
      };

      await service.create(createOrderDto);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 120, // (50*2 - 10) + (30*1)
          discount_amount: 5,
          tax_amount: 8,
          delivery_fee: 10,
          total: 133, // 120 - 5 + 8 + 10
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all non-archived orders', async () => {
      const result = await service.findAll();

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { is_archived: false },
        relations: ['items', 'items.product', 'payments', 'customer', 'branch'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockOrder]);
    });

    it('should filter by user branch_id', async () => {
      await service.findAll('branch-123');

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { is_archived: false, branch_id: 'branch-123' },
        relations: ['items', 'items.product', 'payments', 'customer', 'branch'],
        order: { created_at: 'DESC' },
      });
    });

    it('should filter by status', async () => {
      await service.findAll(undefined, undefined, OrderStatus.PENDING);

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { is_archived: false, status: OrderStatus.PENDING },
        relations: ['items', 'items.product', 'payments', 'customer', 'branch'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const result = await service.findOne(mockOrder.id as string);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        relations: [
          'items',
          'items.product',
          'payments',
          'customer',
          'branch',
          'user',
          'delivery_address',
        ],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return an order by order number', async () => {
      const result = await service.findByOrderNumber('ORD-TEST123');

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { order_number: 'ORD-TEST123' },
        relations: ['items', 'items.product', 'payments', 'customer'],
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      const dto = { status: OrderStatus.PREPARING };

      const result = await service.updateStatus(mockOrder.id as string, dto);

      expect(orderRepository.save!).toHaveBeenCalled();
    });

    it('should throw BadRequestException for cancelled orders', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      orderRepository.findOne!.mockResolvedValue(cancelledOrder);

      const dto = { status: OrderStatus.PREPARING };

      await expect(
        service.updateStatus(mockOrder.id as string, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('should archive a delivered order', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      orderRepository.findOne!.mockResolvedValue(deliveredOrder);

      const result = await service.archive(mockOrder.id as string);

      expect(orderRepository.save!).toHaveBeenCalledWith(
        expect.objectContaining({ is_archived: true }),
      );
    });

    it('should throw BadRequestException for non-closed orders', async () => {
      const pendingOrder = { ...mockOrder, status: OrderStatus.PENDING };
      orderRepository.findOne!.mockResolvedValue(pendingOrder);

      await expect(service.archive(mockOrder.id as string)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
