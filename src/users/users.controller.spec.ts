import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const mockUsersService = {
  findOne: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  describe('getMe', () => {
    it('should call usersService.findOne with userId from @CurrentUser', async () => {
      const currentUser = { sub: 'user-uuid-123' };
      mockUsersService.findOne.mockResolvedValue({
        id: 'user-uuid-123',
        email: 'test@example.com',
      });

      const result = await controller.getMe(currentUser);

      expect(service.findOne).toHaveBeenCalledWith('user-uuid-123');
      expect(result).toEqual({
        id: 'user-uuid-123',
        email: 'test@example.com',
      });
    });
  });

  describe('updateMe', () => {
    it('should call usersService.updateMe with userId and dto', async () => {
      const currentUser = { sub: 'user-uuid-123' };
      const dto: UpdateMeDto = { first_name: 'Updated' };
      mockUsersService.updateMe.mockResolvedValue({
        id: 'user-uuid-123',
        first_name: 'Updated',
      });

      const result = await controller.updateMe(currentUser, dto);

      expect(service.updateMe).toHaveBeenCalledWith('user-uuid-123', dto);
      expect(result).toEqual({ id: 'user-uuid-123', first_name: 'Updated' });
    });
  });

  describe('changePassword', () => {
    it('should call usersService.changePassword with userId, currentPassword, newPassword', async () => {
      const currentUser = { sub: 'user-uuid-123' };
      const dto: ChangePasswordDto = {
        currentPassword: 'old123',
        newPassword: 'newSecure456!',
      };
      mockUsersService.changePassword.mockResolvedValue(undefined);

      await controller.changePassword(currentUser, dto);

      expect(service.changePassword).toHaveBeenCalledWith(
        'user-uuid-123',
        'old123',
        'newSecure456!',
      );
    });
  });
});
