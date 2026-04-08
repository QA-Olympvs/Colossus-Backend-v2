import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RolePermissionsSeeder } from '../src/database/seeds/role-permissions.seed';
import { PermissionsService } from '../src/permissions/permissions.service';
import { RolesService } from '../src/roles/roles.service';
import { Permission } from '../src/permissions/entities/permission.entity';
import { Role } from '../src/roles/entities/role.entity';
import { RolePermission } from '../src/permissions/entities/role-permission.entity';
import { BranchPermission } from '../src/permissions/entities/branch-permission.entity';

describe('RolePermissionsSeeder Integration', () => {
  let moduleRef: TestingModule;
  let seeder: RolePermissionsSeeder;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Permission, Role, RolePermission, BranchPermission],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Permission,
          Role,
          RolePermission,
          BranchPermission,
        ]),
      ],
      providers: [RolePermissionsSeeder, PermissionsService, RolesService],
    }).compile();

    seeder = moduleRef.get<RolePermissionsSeeder>(RolePermissionsSeeder);
    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should seed permissions into database', async () => {
    await seeder.seed();

    // Verify roles were created
    const roleRepository = dataSource.getRepository(Role);
    const roles = await roleRepository.find();
    expect(roles).toHaveLength(5);
    expect(roles.map((r) => r.name)).toContain('super_admin');
    expect(roles.map((r) => r.name)).toContain('coordinador');
    expect(roles.map((r) => r.name)).toContain('administrador');
    expect(roles.map((r) => r.name)).toContain('empleado');
    expect(roles.map((r) => r.name)).toContain('repartidor');
  });

  it('should assign permissions to super_admin role', async () => {
    await seeder.seed();

    const rolePermissionRepository = dataSource.getRepository(RolePermission);
    const roleRepository = dataSource.getRepository(Role);

    const superAdmin = await roleRepository.findOne({
      where: { name: 'super_admin' },
    });
    const permissions = await rolePermissionRepository.find({
      where: { role: { id: superAdmin!.id } },
      relations: ['permission'],
    });

    // super_admin should have all MANAGE permissions
    const managePermissions = permissions.filter(
      (p) => p.permission.action === 'manage',
    );
    expect(managePermissions.length).toBeGreaterThan(0);
  });
});
