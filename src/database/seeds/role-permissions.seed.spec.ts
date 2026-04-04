import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsSeeder } from './role-permissions.seed';
import { PermissionsService } from '../../permissions/permissions.service';
import { RolesService } from '../../roles/roles.service';

describe('RolePermissionsSeeder', () => {
  let seeder: RolePermissionsSeeder;
  let permissionsService: PermissionsService;
  let rolesService: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsSeeder,
        {
          provide: PermissionsService,
          useValue: {
            seedAllPermissions: vi.fn().mockResolvedValue([]),
            assignManagePermissionsToRole: vi.fn().mockResolvedValue(undefined),
            assignToRole: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RolesService,
          useValue: {
            findOrCreate: vi
              .fn()
              .mockResolvedValue({ id: 'role-1', name: 'test' }),
          },
        },
      ],
    }).compile();

    seeder = module.get<RolePermissionsSeeder>(RolePermissionsSeeder);
    permissionsService = module.get(PermissionsService);
    rolesService = module.get(RolesService);
  });

  it('should be defined', () => {
    expect(seeder).toBeDefined();
  });

  describe('seed', () => {
    it('should call seedAllPermissions', async () => {
      await seeder.seed();
      expect(permissionsService.seedAllPermissions).toHaveBeenCalledTimes(1);
    });

    it('should create super_admin role with manage permissions', async () => {
      await seeder.seed();
      expect(rolesService.findOrCreate).toHaveBeenCalledWith(
        'super_admin',
        'Super Administrator with full access',
        true,
      );
      expect(
        permissionsService.assignManagePermissionsToRole,
      ).toHaveBeenCalledWith('role-1');
    });

    it('should create coordinador role with CRU permissions', async () => {
      await seeder.seed();
      expect(rolesService.findOrCreate).toHaveBeenCalledWith(
        'coordinador',
        'Coordinador',
        true,
      );
      // Should assign permissions for orders, products, categories (CRU), and users, customers, branches (R)
      expect(permissionsService.assignToRole).toHaveBeenCalled();
    });

    it('should create administrador role with CRUD permissions', async () => {
      await seeder.seed();
      expect(rolesService.findOrCreate).toHaveBeenCalledWith(
        'administrador',
        'Administrador',
        true,
      );
    });

    it('should create empleado role with read-only permissions', async () => {
      await seeder.seed();
      expect(rolesService.findOrCreate).toHaveBeenCalledWith(
        'empleado',
        'Empleado',
        true,
      );
    });

    it('should create repartidor role with orders:read and orders:update', async () => {
      await seeder.seed();
      expect(rolesService.findOrCreate).toHaveBeenCalledWith(
        'repartidor',
        'Repartidor',
        true,
      );
    });
  });
});
