import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ModulesService } from '../modules/modules.service';
import { BranchesService } from '../branches/branches.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MockedFunction } from 'vitest';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn().mockReturnValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, MockedFunction<any>>>;
  let jwtService: Partial<Record<keyof JwtService, MockedFunction<any>>>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    password: 'hashed_password',
    branch_id: 'branch-123',
    is_owner: false,
    is_active: true,
    user_roles: [],
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      findOne: vi.fn(),
      assignRole: vi.fn(),
    };

    jwtService = {
      sign: vi.fn().mockReturnValue('mock_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RolesService,
          useValue: {
            findOrCreate: vi.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            seedAllPermissions: vi.fn(),
            assignManagePermissionsToRoleForBranch: vi.fn(),
          },
        },
        {
          provide: ModulesService,
          useValue: {
            seedModules: vi.fn(),
          },
        },
        {
          provide: BranchesService,
          useValue: {
            create: vi.fn(),
            createDefaultSchedules: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as unknown as MockedFunction<any>).mockResolvedValue(
        true,
      );

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(usersService.findByEmail!).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as unknown as MockedFunction<any>).mockResolvedValue(
        false,
      );

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as unknown as MockedFunction<any>).mockResolvedValue(
        true,
      );

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock_jwt_token');
      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        branch_id: mockUser.branch_id,
      });
    });

    it('should not include password in response', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as unknown as MockedFunction<any>).mockResolvedValue(
        true,
      );

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile with roles and permissions', async () => {
      const userWithRoles = {
        ...mockUser,
        user_roles: [
          {
            role: {
              name: 'ADMIN',
              role_permissions: [],
              branch_permissions: [],
            },
          },
        ],
      };
      usersService.findOne!.mockResolvedValue(userWithRoles);

      const result = await service.getProfile(mockUser.id);

      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          roles: expect.any(Array),
          permissions: expect.any(Array),
        }),
      );
    });
  });
});
