import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModulesService } from './modules.service';
import { Module } from './entities/module.entity';
import { RoleModule } from './entities/role-module.entity';
import { Role } from '../roles/entities/role.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { MockedFunction } from 'vitest';

describe('ModulesService', () => {
  let service: ModulesService;
  let moduleRepository: Partial<
    Record<keyof Repository<Module>, MockedFunction<any>>
  >;
  let roleModuleRepository: Partial<
    Record<keyof Repository<RoleModule>, MockedFunction<any>>
  >;
  let roleRepository: Partial<
    Record<keyof Repository<Role>, MockedFunction<any>>
  >;

  const mockModule: Partial<Module> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'products',
    label: 'Productos',
    icon: 'pi-box',
    route: '/dashboard/products',
    order: 1,
    is_active: true,
  };

  beforeEach(async () => {
    moduleRepository = {
      create: vi.fn().mockReturnValue(mockModule),
      save: vi.fn().mockResolvedValue(mockModule),
      find: vi.fn().mockResolvedValue([mockModule]),
      findOne: vi.fn().mockResolvedValue(mockModule),
      remove: vi.fn().mockResolvedValue(undefined),
      createQueryBuilder: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockModule]),
      }),
    };

    roleModuleRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    roleRepository = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        {
          provide: getRepositoryToken(Module),
          useValue: moduleRepository,
        },
        {
          provide: getRepositoryToken(RoleModule),
          useValue: roleModuleRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
  });

  describe('findAll', () => {
    it('should return all modules ordered by order', async () => {
      const result = await service.findAll();

      expect(moduleRepository.find).toHaveBeenCalledWith({
        order: { order: 'ASC' },
      });
      expect(result).toEqual([mockModule]);
    });
  });

  describe('findAllActive', () => {
    it('should return active modules ordered by order', async () => {
      const result = await service.findAllActive();

      expect(moduleRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { order: 'ASC' },
      });
      expect(result).toEqual([mockModule]);
    });
  });

  describe('findOne', () => {
    it('should return a module by id', async () => {
      const result = await service.findOne(mockModule.id as string);

      expect(moduleRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockModule.id },
      });
      expect(result).toEqual(mockModule);
    });

    it('should throw NotFoundException if module not found', async () => {
      moduleRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByRoles', () => {
    it('should return empty array if no roles provided', async () => {
      const result = await service.findByRoles([]);

      expect(result).toEqual([]);
    });

    it('should return all modules for system role', async () => {
      roleRepository.findOne!.mockResolvedValue({
        id: 'role-1',
        is_system: true,
      });

      const result = await service.findByRoles(['super_admin']);

      expect(moduleRepository.find!).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { order: 'ASC' },
      });
    });

    it('should map frontend role names to backend names', async () => {
      roleRepository.findOne!.mockResolvedValue(null);

      await service.findByRoles(['coordinador']);

      expect(moduleRepository.createQueryBuilder!).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new module successfully', async () => {
      moduleRepository.findOne!.mockResolvedValue(null); // No existing module

      const createModuleDto = {
        name: 'new-module',
        label: 'New Module',
        icon: 'pi-star',
        route: '/dashboard/new',
        order: 2,
      };

      const result = await service.create(createModuleDto);

      expect(moduleRepository.create!).toHaveBeenCalledWith(createModuleDto);
      expect(moduleRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockModule);
    });

    it('should throw ConflictException if module already exists', async () => {
      const createModuleDto = {
        name: 'products',
        label: 'Products',
      };

      await expect(
        service.create(createModuleDto as unknown as CreateModuleDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a module successfully', async () => {
      const updateModuleDto = {
        label: 'Updated Products',
        is_active: false,
      };

      const updatedModule = { ...mockModule, ...updateModuleDto };
      moduleRepository.save!.mockResolvedValue(updatedModule);

      const result = await service.update(
        mockModule.id as string,
        updateModuleDto,
      );

      expect(moduleRepository.save!).toHaveBeenCalled();
      expect(result.label).toBe('Updated Products');
    });
  });

  describe('remove', () => {
    it('should delete a module', async () => {
      await service.remove(mockModule.id as string);

      expect(moduleRepository.remove!).toHaveBeenCalledWith(mockModule);
    });
  });

  describe('assignToRole', () => {
    it('should assign module to role', async () => {
      roleRepository.findOne!.mockResolvedValue({ id: 'role-123' });
      const assignModuleDto = { role_id: 'role-123' };

      const result = await service.assignToRole(
        mockModule.id as string,
        assignModuleDto,
      );

      expect(roleModuleRepository.create!).toHaveBeenCalledWith({
        role: { id: 'role-123' },
        module: { id: mockModule.id },
      });
      expect(roleModuleRepository.save!).toHaveBeenCalled();
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne!.mockResolvedValue(null);
      const assignModuleDto = { role_id: 'non-existent-role' };

      await expect(
        service.assignToRole(mockModule.id as string, assignModuleDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if module already assigned', async () => {
      roleRepository.findOne!.mockResolvedValue({ id: 'role-123' });
      roleModuleRepository.findOne!.mockResolvedValue({ id: 'existing' });
      const assignModuleDto = { role_id: 'role-123' };

      await expect(
        service.assignToRole(mockModule.id as string, assignModuleDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFromRole', () => {
    it('should remove module from role', async () => {
      roleModuleRepository.findOne!.mockResolvedValue({ id: 'rm-123' });

      await service.removeFromRole(mockModule.id as string, 'role-123');

      expect(roleModuleRepository.remove!).toHaveBeenCalled();
    });

    it('should throw NotFoundException if module not assigned', async () => {
      roleModuleRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.removeFromRole(mockModule.id as string, 'role-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getModulesForRole', () => {
    it('should return modules for a role', async () => {
      const roleModules = [
        { module: { id: 'm1', name: 'products' } },
        { module: { id: 'm2', name: 'orders' } },
      ];
      roleModuleRepository.find!.mockResolvedValue(roleModules);

      const result = await service.getModulesForRole('role-123');

      expect(roleModuleRepository.find!).toHaveBeenCalledWith({
        where: { role: { id: 'role-123' } },
        relations: ['module'],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('seedModules', () => {
    it('should create default modules', async () => {
      moduleRepository.findOne!.mockResolvedValue(null);
      roleRepository.findOne!.mockResolvedValue({ id: 'admin-role' });

      await service.seedModules();

      expect(moduleRepository.create!).toHaveBeenCalled();
      expect(moduleRepository.save!).toHaveBeenCalled();
    });

    it('should assign modules to ADMIN role', async () => {
      moduleRepository.findOne!.mockResolvedValue(null);
      roleRepository.findOne!.mockResolvedValue({ id: 'admin-role' });

      await service.seedModules();

      // Should assign all modules to admin
      expect(roleModuleRepository.findOne).toHaveBeenCalled();
    });
  });
});
