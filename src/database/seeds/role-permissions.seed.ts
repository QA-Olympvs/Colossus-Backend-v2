import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from '../../permissions/permissions.service';
import { RolesService } from '../../roles/roles.service';
import { PermissionAction } from '../../permissions/entities/permission.entity';
import { BranchPermission } from '../../permissions/entities/branch-permission.entity';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class RolePermissionsSeeder {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService,
    @InjectRepository(BranchPermission)
    private readonly branchPermissionRepository: Repository<BranchPermission>,
    private readonly branchesService: BranchesService,
  ) {}

  async seed(): Promise<void> {
    // 1. Asegurar que todos los permisos existen
    await this.permissionsService.seedAllPermissions();

    // 2. Asignar permisos globales a cada rol
    await this.seedSuperAdminPermissions();
    await this.seedCoordinadorPermissions();
    await this.seedAdministradorPermissions();
    await this.seedEmpleadoPermissions();
    await this.seedRepartidorPermissions();

    // 3. Asignar permisos por sucursal para super_admin
    await this.seedSuperAdminBranchPermissions();
  }

  private async seedSuperAdminPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'super_admin',
      'Super Administrator with full access',
      true,
    );
    await this.permissionsService.assignManagePermissionsToRole(role.id);
  }

  private async seedSuperAdminBranchPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'super_admin',
      'Super Administrator with full access',
      true,
    );

    // Obtener todas las sucursales
    const branches = await this.branchesService.findAll();

    // Asignar permisos MANAGE a super_admin para cada sucursal
    for (const branch of branches) {
      await this.permissionsService.assignManagePermissionsToRoleForBranch(
        role.id,
        branch.id,
      );
    }
  }

  private async seedCoordinadorPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'coordinador',
      'Coordinador',
      false,
    );
    await this.assignPermissionToRole(role.id, 'orders', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(role.id, 'users', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'customers',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'branches',
      PermissionAction.READ,
    );
  }

  private async seedAdministradorPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'administrador',
      'Administrador',
      false,
    );
    await this.assignPermissionToRole(role.id, 'orders', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.DELETE,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.DELETE,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.DELETE,
    );
    await this.assignPermissionToRole(role.id, 'users', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'users',
      PermissionAction.UPDATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'users',
      PermissionAction.CREATE,
    );
    await this.assignPermissionToRole(
      role.id,
      'customers',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'branches',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'branches',
      PermissionAction.UPDATE,
    );
  }

  private async seedEmpleadoPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'empleado',
      'Empleado',
      false,
    );
    await this.assignPermissionToRole(role.id, 'orders', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'products',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'categories',
      PermissionAction.READ,
    );
    await this.assignPermissionToRole(
      role.id,
      'customers',
      PermissionAction.READ,
    );
  }

  private async seedRepartidorPermissions(): Promise<void> {
    const role = await this.rolesService.findOrCreate(
      'repartidor',
      'Repartidor',
      false,
    );
    await this.assignPermissionToRole(role.id, 'orders', PermissionAction.READ);
    await this.assignPermissionToRole(
      role.id,
      'orders',
      PermissionAction.UPDATE,
    );
  }

  private async assignPermissionToRole(
    roleId: string,
    resource: string,
    action: PermissionAction,
  ): Promise<void> {
    try {
      await this.permissionsService.assignToRole(roleId, {
        permission_id: `${resource}:${action}`,
      } as any);
    } catch (error) {
      // Permission might already be assigned, ignore conflict
      if (error.message?.includes('already assigned')) {
        return;
      }
      throw error;
    }
  }
}
