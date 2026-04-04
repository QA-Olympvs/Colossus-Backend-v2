import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MockedFunction } from 'vitest';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: Partial<
    Record<keyof Repository<Role>, MockedFunction<any>>
  >;

  const mockRole: Partial<Role> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'ADMIN',
    description: 'Administrator role',
    is_system: true,
  };

  beforeEach(async () => {
    roleRepository = {
      create: vi.fn().mockReturnValue(mockRole),
      save: vi.fn().mockResolvedValue(mockRole),
      find: vi.fn().mockResolvedValue([mockRole]),
      findOne: vi.fn().mockResolvedValue(mockRole),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('create', () => {
    it('should create a new role successfully', async () => {
      roleRepository.findOne!.mockResolvedValue(null); // No existing role

      const createRoleDto = {
        name: 'NEW_ROLE',
        description: 'New role description',
      };

      const result = await service.create(createRoleDto);

      expect(roleRepository.create!).toHaveBeenCalledWith(createRoleDto);
      expect(roleRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockRole);
    });

    it('should throw ConflictException if role already exists', async () => {
      const createRoleDto = {
        name: 'ADMIN',
        description: 'Duplicate role',
      };

      await expect(service.create(createRoleDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const result = await service.findAll();

      expect(roleRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockRole]);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const result = await service.findOne(mockRole.id as string);

      expect(roleRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockRole.id },
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      const updateRoleDto = {
        description: 'Updated description',
      };

      const updatedRole = { ...mockRole, ...updateRoleDto };
      roleRepository.save!.mockResolvedValue(updatedRole);

      const result = await service.update(mockRole.id as string, updateRoleDto);

      expect(roleRepository.save!).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      await service.remove(mockRole.id as string);

      expect(roleRepository.remove!).toHaveBeenCalledWith(mockRole);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing role if found', async () => {
      const result = await service.findOrCreate('ADMIN');

      expect(roleRepository.findOne!).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
      });
      expect(result).toEqual(mockRole);
    });

    it('should create new role if not found', async () => {
      roleRepository.findOne!.mockResolvedValue(null);
      const newRole = { id: 'new-role-id', name: 'NEW_ROLE' };
      roleRepository.save!.mockResolvedValue(newRole);

      const result = await service.findOrCreate(
        'NEW_ROLE',
        'New role desc',
        true,
      );

      expect(roleRepository.create!).toHaveBeenCalledWith({
        name: 'NEW_ROLE',
        description: 'New role desc',
        is_system: true,
      });
      expect(result).toEqual(newRole);
    });

    it('should create role with defaults when optional params not provided', async () => {
      roleRepository.findOne!.mockResolvedValue(null);
      const newRole = { id: 'new-role-id', name: 'SIMPLE_ROLE' };
      roleRepository.save!.mockResolvedValue(newRole);

      await service.findOrCreate('SIMPLE_ROLE');

      expect(roleRepository.create!).toHaveBeenCalledWith({
        name: 'SIMPLE_ROLE',
        description: undefined,
        is_system: false,
      });
    });
  });
});
