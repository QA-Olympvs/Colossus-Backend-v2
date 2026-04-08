import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import {
  Permission,
  PermissionAction,
  PermissionResource,
} from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { BranchPermission } from './entities/branch-permission.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: Partial<
    Record<keyof Repository<Permission>, MockedFunction<any>>
  >;
  let rolePermissionRepository: Partial<
    Record<keyof Repository<RolePermission>, MockedFunction<any>>
  >;
  let branchPermissionRepository: Partial<
    Record<keyof Repository<BranchPermission>, MockedFunction<any>>
  >;

  const mockPermission: Partial<Permission> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    action: PermissionAction.READ,
    resource: PermissionResource.USERS,
  };

  beforeEach(async () => {
    permissionRepository = {
      create: vi.fn().mockReturnValue(mockPermission),
      save: vi.fn().mockResolvedValue(mockPermission),
      find: vi.fn().mockResolvedValue([mockPermission]),
      findOne: vi.fn().mockResolvedValue(mockPermission),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    rolePermissionRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    branchPermissionRepository = {
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepository,
        },
        {
          provide: getRepositoryToken(BranchPermission),
          useValue: branchPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe('create', () => {
    it('should create a new permission successfully', async () => {
      permissionRepository.findOne!.mockResolvedValue(null); // No existing permission

      const createPermissionDto = {
        action: PermissionAction.CREATE,
        resource: PermissionResource.PRODUCTS,
      };

      const result = await service.create(createPermissionDto);

      expect(permissionRepository.create!).toHaveBeenCalledWith(
        createPermissionDto,
      );
      expect(permissionRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockPermission);
    });

    it('should throw ConflictException if permission already exists', async () => {
      const createPermissionDto = {
        action: PermissionAction.READ,
        resource: PermissionResource.USERS,
      };

      await expect(service.create(createPermissionDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const result = await service.findAll();

      expect(permissionRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockPermission]);
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const result = await service.findOne(mockPermission.id as string);

      expect(permissionRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockPermission.id },
      });
      expect(result).toEqual(mockPermission);
    });

    it('should throw NotFoundException if permission not found', async () => {
      permissionRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a permission successfully', async () => {
      const updatePermissionDto = {
        action: PermissionAction.UPDATE,
      };

      const updatedPermission = { ...mockPermission, ...updatePermissionDto };
      permissionRepository.save!.mockResolvedValue(updatedPermission);

      const result = await service.update(
        mockPermission.id as string,
        updatePermissionDto,
      );

      expect(permissionRepository.save!).toHaveBeenCalled();
      expect(result.action).toBe(PermissionAction.UPDATE);
    });
  });

  describe('remove', () => {
    it('should delete a permission', async () => {
      await service.remove(mockPermission.id as string);

      expect(permissionRepository.remove!).toHaveBeenCalledWith(mockPermission);
    });
  });

  describe('assignToRole', () => {
    it('should assign permission to role', async () => {
      const assignPermissionDto = { permission_id: 'permission-123' };

      const result = await service.assignToRole(
        'role-123',
        assignPermissionDto,
      );

      expect(rolePermissionRepository.create!).toHaveBeenCalledWith({
        role: { id: 'role-123' },
        permission: { id: 'permission-123' },
      });
      expect(rolePermissionRepository.save!).toHaveBeenCalled();
    });

    it('should throw ConflictException if permission already assigned', async () => {
      rolePermissionRepository.findOne!.mockResolvedValue({ id: 'existing' });
      const assignPermissionDto = { permission_id: 'permission-123' };

      await expect(
        service.assignToRole('role-123', assignPermissionDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFromRole', () => {
    it('should remove permission from role', async () => {
      rolePermissionRepository.findOne!.mockResolvedValue({ id: 'rp-123' });

      await service.removeFromRole('role-123', 'permission-123');

      expect(rolePermissionRepository.remove!).toHaveBeenCalled();
    });

    it('should throw NotFoundException if permission not assigned', async () => {
      rolePermissionRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.removeFromRole('role-123', 'permission-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return permissions for a role', async () => {
      const rolePermissions = [
        { permission: { id: 'p1', action: 'READ' } },
        { permission: { id: 'p2', action: 'WRITE' } },
      ];
      rolePermissionRepository.find!.mockResolvedValue(rolePermissions);

      const result = await service.getPermissionsForRole('role-123');

      expect(rolePermissionRepository.find!).toHaveBeenCalledWith({
        where: { role: { id: 'role-123' } },
        relations: ['permission'],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('seedAllPermissions', () => {
    it('should create all permission combinations', async () => {
      permissionRepository.findOne!.mockResolvedValue(null);
      permissionRepository.save!.mockResolvedValue({});

      const result = await service.seedAllPermissions();

      // Number of actions * number of resources
      const expectedCount =
        Object.values(PermissionAction).length *
        Object.values(PermissionResource).length;
      expect(permissionRepository.save!).toHaveBeenCalledTimes(expectedCount);
    });

    it('should not recreate existing permissions', async () => {
      permissionRepository.findOne!.mockResolvedValue({ id: 'existing' });

      await service.seedAllPermissions();

      expect(permissionRepository.create!).not.toHaveBeenCalled();
    });
  });

  describe('assignManagePermissionsToRole', () => {
    it('should assign MANAGE permissions to role', async () => {
      permissionRepository.findOne!.mockResolvedValue({ id: 'perm-123' });
      rolePermissionRepository.findOne!.mockResolvedValue(null);

      await service.assignManagePermissionsToRole('role-123');

      expect(permissionRepository.findOne!).toHaveBeenCalledWith({
        where: {
          action: PermissionAction.MANAGE,
          resource: expect.any(String),
        },
      });
    });
  });

  describe('assignManagePermissionsToRoleForBranch', () => {
    it('should assign MANAGE permissions to role for branch', async () => {
      permissionRepository.findOne!.mockResolvedValue({ id: 'perm-123' });
      branchPermissionRepository.findOne!.mockResolvedValue(null);

      await service.assignManagePermissionsToRoleForBranch(
        'role-123',
        'branch-123',
      );

      expect(branchPermissionRepository.create!).toHaveBeenCalledWith({
        role: { id: 'role-123' },
        permission: { id: 'perm-123' },
        branch: { id: 'branch-123' },
      });
    });
  });

  describe('getPermissionsForRoleInBranch', () => {
    it('should return permissions for role in branch', async () => {
      const branchPermissions = [{ permission: { id: 'p1', action: 'READ' } }];
      branchPermissionRepository.find!.mockResolvedValue(branchPermissions);

      const result = await service.getPermissionsForRoleInBranch(
        'role-123',
        'branch-123',
      );

      expect(branchPermissionRepository.find!).toHaveBeenCalledWith({
        where: { role: { id: 'role-123' }, branch: { id: 'branch-123' } },
        relations: ['permission'],
      });
      expect(result).toHaveLength(1);
    });
  });
});
