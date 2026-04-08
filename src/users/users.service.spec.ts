import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MockedFunction } from 'vitest';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Partial<
    Record<keyof Repository<User>, MockedFunction<any>>
  >;
  let userRoleRepository: Partial<
    Record<keyof Repository<UserRole>, MockedFunction<any>>
  >;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    password: 'hashed_password',
    is_active: true,
  };

  beforeEach(async () => {
    userRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn().mockReturnValue(mockUser),
      save: vi.fn().mockResolvedValue(mockUser),
    };

    userRoleRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: userRoleRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const result = await service.create(createUserDto);

      expect(userRepository.findOne!).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create!).toHaveBeenCalled();
      expect(userRepository.save!).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne!.mockResolvedValue(mockUser);

      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      userRepository.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepository.find!).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['user_roles', 'user_roles.role'],
      });
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id as string);

      expect(userRepository.findOne!).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: [
          'branch',
          'user_roles',
          'user_roles.role',
          'user_roles.role.branch_permissions',
          'user_roles.role.branch_permissions.permission',
          'user_roles.role.role_permissions',
          'user_roles.role.role_permissions.permission',
        ],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findOne!).toHaveBeenCalledWith({
        where: { email: 'test@example.com', is_active: true },
        relations: [
          'user_roles',
          'user_roles.role',
          'user_roles.role.role_permissions',
          'user_roles.role.role_permissions.permission',
        ],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const userToDelete = { ...mockUser, is_active: true };
      userRepository.findOne!.mockResolvedValue(userToDelete);
      userRepository.save!.mockResolvedValue({
        ...userToDelete,
        is_active: false,
      });

      await service.remove(mockUser.id as string);

      expect(userRepository.save!).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });
});
