import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';
import { BranchSchedule, DayOfWeek } from './entities/branch-schedule.entity';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Order } from '../orders/entities/order.entity';
import { NotFoundException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('BranchesService', () => {
  let service: BranchesService;
  let branchRepository: Partial<
    Record<keyof Repository<Branch>, MockedFunction<any>>
  >;
  let scheduleRepository: Partial<
    Record<keyof Repository<BranchSchedule>, MockedFunction<any>>
  >;
  let orderRepository: Partial<
    Record<keyof Repository<Order>, MockedFunction<any>>
  >;
  let usersService: Partial<Record<keyof UsersService, MockedFunction<any>>>;
  let permissionsService: Partial<
    Record<keyof PermissionsService, MockedFunction<any>>
  >;

  const mockBranch: Partial<Branch> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Branch',
    address: '123 Test St',
    phone: '1234567890',
    email: 'branch@test.com',
    is_active: true,
  };

  beforeEach(async () => {
    branchRepository = {
      create: vi.fn().mockReturnValue(mockBranch),
      save: vi.fn().mockResolvedValue(mockBranch),
      find: vi.fn().mockResolvedValue([mockBranch]),
      findOne: vi.fn().mockResolvedValue(mockBranch),
    };

    scheduleRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue([]),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    orderRepository = {
      find: vi.fn().mockResolvedValue([]),
    };

    usersService = {
      findOne: vi.fn(),
    };

    permissionsService = {
      assignManagePermissionsToRoleForBranch: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepository,
        },
        {
          provide: getRepositoryToken(BranchSchedule),
          useValue: scheduleRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: PermissionsService,
          useValue: permissionsService,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('create', () => {
    it('should create a new branch with default schedules', async () => {
      const createBranchDto = {
        name: 'Test Branch',
        address: '123 Test St',
        phone: '1234567890',
      };

      const result = await service.create(createBranchDto);

      expect(branchRepository.create).toHaveBeenCalledWith(createBranchDto);
      expect(branchRepository.save).toHaveBeenCalled();
      expect(scheduleRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBranch);
    });

    it('should assign permissions when user is owner', async () => {
      const createBranchDto = {
        name: 'Test Branch',
        address: '123 Test St',
      };

      const userId = 'user-123';
      usersService.findOne!.mockResolvedValue({
        id: userId,
        is_owner: true,
        user_roles: [{ role: { id: 'role-1', name: 'ADMIN' } }],
      });

      await service.create(createBranchDto, userId);

      expect(
        permissionsService.assignManagePermissionsToRoleForBranch!,
      ).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active branches', async () => {
      const result = await service.findAll();

      expect(branchRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
      });
      expect(result).toEqual([mockBranch]);
    });
  });

  describe('findOne', () => {
    it('should return a branch by id', async () => {
      const result = await service.findOne(mockBranch.id as string);

      expect(branchRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockBranch.id },
        relations: ['schedules'],
      });
      expect(result).toEqual(mockBranch);
    });

    it('should throw NotFoundException if branch not found', async () => {
      branchRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a branch successfully', async () => {
      const updateBranchDto = {
        name: 'Updated Branch',
        phone: '0987654321',
      };

      const updatedBranch = { ...mockBranch, ...updateBranchDto };
      branchRepository.save!.mockResolvedValue(updatedBranch);

      const result = await service.update(
        mockBranch.id as string,
        updateBranchDto,
      );

      expect(branchRepository.save!).toHaveBeenCalled();
      expect(result.name).toBe('Updated Branch');
    });
  });

  describe('remove', () => {
    it('should soft delete a branch', async () => {
      await service.remove(mockBranch.id as string);

      expect(branchRepository.save!).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });

  describe('createDefaultSchedules', () => {
    it('should create default schedules for a branch', async () => {
      const schedules = await service.createDefaultSchedules('branch-123');

      expect(scheduleRepository.create!).toHaveBeenCalledTimes(7); // 5 weekdays + 2 weekend
      expect(scheduleRepository.save!).toHaveBeenCalled();
    });

    it('should return existing schedules if they already exist', async () => {
      scheduleRepository.find!.mockResolvedValue([{ id: 'existing-schedule' }]);

      const schedules = await service.createDefaultSchedules('branch-123');

      expect(schedules).toEqual([{ id: 'existing-schedule' }]);
      expect(scheduleRepository.create!).not.toHaveBeenCalled();
    });
  });

  describe('findSchedules', () => {
    it('should return schedules for a branch', async () => {
      const mockSchedules = [
        { id: '1', day_of_week: DayOfWeek.MONDAY, open_time: '08:00' },
      ];
      scheduleRepository.find!.mockResolvedValue(mockSchedules);

      const result = await service.findSchedules(mockBranch.id as string);

      expect(scheduleRepository.find!).toHaveBeenCalledWith({
        where: { branch_id: mockBranch.id },
      });
      expect(result).toEqual(mockSchedules);
    });
  });

  describe('upsertSchedule', () => {
    it('should create new schedule if not exists', async () => {
      const dto = {
        day_of_week: DayOfWeek.MONDAY,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: false,
      };

      const newSchedule = { id: 'new-schedule', ...dto };
      scheduleRepository.create!.mockReturnValue(newSchedule);
      scheduleRepository.save!.mockResolvedValue(newSchedule);

      const result = await service.upsertSchedule('branch-123', dto);

      expect(scheduleRepository.create!).toHaveBeenCalledWith({
        ...dto,
        branch_id: 'branch-123',
      });
      expect(result).toEqual(newSchedule);
    });

    it('should update existing schedule', async () => {
      const existingSchedule = {
        id: 'existing',
        branch_id: 'branch-123',
        day_of_week: DayOfWeek.MONDAY,
        open_time: '08:00',
      };
      scheduleRepository.findOne!.mockResolvedValue(existingSchedule);

      const dto = {
        day_of_week: DayOfWeek.MONDAY,
        open_time: '10:00',
      };

      const result = await service.upsertSchedule('branch-123', dto);

      expect(Object.assign).toHaveBeenCalled;
      expect(scheduleRepository.save!).toHaveBeenCalled();
    });
  });

  describe('removeSchedule', () => {
    it('should remove a schedule', async () => {
      const schedule = { id: 'schedule-123', branch_id: 'branch-123' };
      scheduleRepository.findOne!.mockResolvedValue(schedule);

      await service.removeSchedule('branch-123', 'schedule-123');

      expect(scheduleRepository.remove!).toHaveBeenCalledWith(schedule);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      scheduleRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.removeSchedule('branch-123', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
