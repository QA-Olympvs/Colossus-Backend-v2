import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutesService } from './routes.service';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Order } from '../orders/entities/order.entity';
import { Branch } from '../branches/entities/branch.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { MockedFunction } from 'vitest';

describe('RoutesService', () => {
  let service: RoutesService;
  let routeRepository: Partial<
    Record<keyof Repository<DeliveryRoute>, MockedFunction<any>>
  >;
  let stopRepository: Partial<
    Record<keyof Repository<RouteStop>, MockedFunction<any>>
  >;
  let orderRepository: Partial<
    Record<keyof Repository<Order>, MockedFunction<any>>
  >;
  let branchRepository: Partial<
    Record<keyof Repository<Branch>, MockedFunction<any>>
  >;

  const mockRoute: Partial<DeliveryRoute> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Route',
    status: 'pending',
    assigned_user_id: 'user-123',
    stops: [],
  };

  beforeEach(async () => {
    routeRepository = {
      create: vi.fn().mockReturnValue(mockRoute),
      save: vi.fn().mockResolvedValue(mockRoute),
      find: vi.fn().mockResolvedValue([mockRoute]),
      findOne: vi.fn().mockResolvedValue(mockRoute),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    stopRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue({}),
      findOne: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    orderRepository = {
      update: vi.fn().mockResolvedValue(undefined),
      manager: {
        query: vi.fn().mockResolvedValue([{ requires_delivery_photo: false }]),
      } as any,
    };

    branchRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: getRepositoryToken(DeliveryRoute),
          useValue: routeRepository,
        },
        {
          provide: getRepositoryToken(RouteStop),
          useValue: stopRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepository,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
  });

  describe('create', () => {
    it('should create a new route with stops', async () => {
      const createRouteDto = {
        name: 'Test Route',
        branch_id: 'branch-123',
        stops: [
          { customer_direction_id: 'dir-1', stop_order: 1 },
          { customer_direction_id: 'dir-2', stop_order: 2 },
        ],
      };

      const result = await service.create(
        createRouteDto as unknown as CreateRouteDto,
      );

      expect(routeRepository.create).toHaveBeenCalled();
      expect(stopRepository.create).toHaveBeenCalledTimes(2);
      expect(routeRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockRoute);
    });
  });

  describe('findAll', () => {
    it('should return all routes', async () => {
      const result = await service.findAll();

      expect(routeRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['assigned_user', 'stops', 'stops.customer_direction'],
        order: { created_at: 'DESC', stops: { stop_order: 'ASC' } },
      });
      expect(result).toEqual([mockRoute]);
    });

    it('should filter by business_id', async () => {
      await service.findAll('business-123');

      expect(routeRepository.find).toHaveBeenCalledWith({
        where: { business_id: 'business-123' },
        relations: ['assigned_user', 'stops', 'stops.customer_direction'],
        order: { created_at: 'DESC', stops: { stop_order: 'ASC' } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a route by id', async () => {
      const result = await service.findOne(mockRoute.id as string);

      expect(routeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockRoute.id },
        relations: ['assigned_user', 'stops', 'stops.customer_direction'],
        order: { stops: { stop_order: 'ASC' } },
      });
      expect(result).toEqual(mockRoute);
    });

    it('should throw NotFoundException if route not found', async () => {
      routeRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByAssignedUser', () => {
    it('should return routes assigned to user', async () => {
      const result = await service.findByAssignedUser('user-123');

      expect(routeRepository.find!).toHaveBeenCalledWith({
        where: { assigned_user_id: 'user-123' },
        relations: ['assigned_user', 'stops', 'stops.customer_direction'],
        order: { created_at: 'DESC', stops: { stop_order: 'ASC' } },
      });
      expect(result).toEqual([mockRoute]);
    });
  });

  describe('update', () => {
    it('should update a route', async () => {
      const updateRouteDto = {
        name: 'Updated Route',
        stops: [{ customer_direction_id: 'dir-3', stop_order: 1 }],
      };

      const result = await service.update(
        mockRoute.id as string,
        updateRouteDto as unknown as UpdateRouteDto,
      );

      expect(stopRepository.delete).toHaveBeenCalledWith({
        route_id: mockRoute.id,
      });
      expect(routeRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update route status to in_progress', async () => {
      const result = await service.updateStatus(
        mockRoute.id as string,
        'in_progress',
      );

      expect(routeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          started_at: expect.any(Date),
        }),
      );
    });

    it('should update route status to completed', async () => {
      const result = await service.updateStatus(
        mockRoute.id as string,
        'completed',
      );

      expect(routeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(Date),
        }),
      );
    });
  });

  describe('updateStopStatus', () => {
    it('should throw NotFoundException if stop not found', async () => {
      stopRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateStopStatus('route-123', 'stop-123', {
          status: 'completed',
        } as unknown as UpdateStopStatusDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate proximity for completed stops', async () => {
      const stop = {
        id: 'stop-123',
        route_id: 'route-123',
        latitude: 19.4326,
        longitude: -99.1332,
        customer_direction: null,
      };
      stopRepository.findOne!.mockResolvedValue(stop);

      await expect(
        service.updateStopStatus('route-123', 'stop-123', {
          status: 'completed',
          current_latitude: 40.7128,
          current_longitude: -74.006,
        } as unknown as UpdateStopStatusDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require coordinates for completed stops', async () => {
      const stop = {
        id: 'stop-123',
        route_id: 'route-123',
        latitude: 19.4326,
        longitude: -99.1332,
        customer_direction: null,
      };
      stopRepository.findOne!.mockResolvedValue(stop);

      await expect(
        service.updateStopStatus('route-123', 'stop-123', {
          status: 'completed',
        } as unknown as UpdateStopStatusDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a route', async () => {
      await service.remove(mockRoute.id as string);

      expect(routeRepository.remove).toHaveBeenCalledWith(mockRoute);
    });
  });
});
