import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ModulesService } from '../modules/modules.service';
import { BranchesModule } from '../branches/branches.module';
import { BranchesService } from '../branches/branches.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly modulesService: ModulesService,
    private readonly jwtService: JwtService,
    private readonly branchesService: BranchesService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private buildToken(user: User): { access_token: string } {
    // Minimal JWT - only authentication data
    // Roles and permissions are fetched fresh from /auth/me endpoint
    const payload = {
      sub: user.id,
      email: user.email,
      branch_id: user.branch_id,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const token = this.buildToken(user);
    const { password: _pw, ...userWithoutPassword } = user as User & {
      password: string;
    };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing)
      throw new ConflictException('User with this email already exists');

    const isFirstUser = (await this.usersService.findAll()).length === 0;
    const user = await this.usersService.create(registerDto);

    if (isFirstUser) {
      const adminRole = await this.rolesService.findOrCreate(
        'ADMIN',
        'Super administrator with full access',
        true,
      );
      await this.permissionsService.seedAllPermissions();
      await this.modulesService.seedModules();

      // Crear sucursal principal con datos del request
      const mainBranch = await this.branchesService.create({
        name:
          registerDto.branch_name ??
          `Sucursal de ${user.first_name} ${user.last_name}`,
        address: registerDto.branch_address,
        phone: registerDto.branch_phone ?? user.phone,
        email: registerDto.branch_email ?? user.email,
        rfc: registerDto.branch_rfc,
        latitude: registerDto.branch_latitude,
        longitude: registerDto.branch_longitude,
        is_accepting_orders: true,
        has_delivery: true,
        has_pickup: true,
      });

      await this.branchesService.createDefaultSchedules(mainBranch.id);

      // Asignar branch_id al usuario admin
      await this.usersService.update(user.id, { branch_id: mainBranch.id });

      // Asignar permisos por sucursal al rol ADMIN
      await this.permissionsService.assignManagePermissionsToRoleForBranch(
        adminRole.id,
        mainBranch.id,
      );
      await this.usersService.assignRole(user.id, { role_id: adminRole.id });
    }

    const freshUser = (await this.usersService.findByEmail(user.email)) as User;
    const token = this.buildToken(freshUser);
    const { password: _pw, ...userWithoutPassword } = freshUser as User & {
      password: string;
    };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }

  /**
   * Get user profile with normalized roles and permissions
   * Used by GET /auth/me endpoint
   *
   * Permissions are loaded exclusively from the database via role_permissions
   * and branch_permissions tables. The previous hard-coded fallback has been
   * removed. Run RolePermissionsSeeder to populate default permissions.
   */
  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    branch_id?: string;
    customer_id?: string | null;
    is_owner: boolean;
    is_active: boolean;
    roles: string[];
    permissions: string[];
  }> {
    const user = await this.usersService.findOne(userId);

    // Normalize roles to lowercase (coordinador, administrador, etc.)
    const roles = (user.user_roles ?? [])
      .map((ur) => this.normalizeRoleName(ur.role?.name))
      .filter((r): r is string => r !== null);

    // Get permissions based on branch_id
    type PermissionRef = { resource: string; action: string };
    type BranchPermissionRef = {
      branch_id: string;
      permission?: PermissionRef | null;
    };
    type RolePermissionRef = {
      permission?: PermissionRef | null;
    };

    const branch_id = user.branch_id;
    const permissions = (user.user_roles ?? [])
      .flatMap((ur) => {
        if (branch_id) {
          const branchPermissions = (ur.role?.branch_permissions ??
            []) as BranchPermissionRef[];
          return branchPermissions
            .filter(
              (bp): bp is BranchPermissionRef & { permission: PermissionRef } =>
                !!bp &&
                bp.branch_id === branch_id &&
                !!bp.permission &&
                typeof bp.permission.resource === 'string' &&
                typeof bp.permission.action === 'string',
            )
            .map((bp) => bp.permission);
        } else {
          const rolePermissions = (ur.role?.role_permissions ??
            []) as RolePermissionRef[];
          return rolePermissions
            .map((rp) => rp.permission)
            .filter(
              (p): p is PermissionRef =>
                !!p &&
                typeof p.resource === 'string' &&
                typeof p.action === 'string',
            );
        }
      })
      .map((p) => `${p.resource}:${p.action}`);

    // BYPASS: Si el usuario tiene un rol is_system, darle todos los permisos MANAGE
    const hasSystemRole = (user.user_roles ?? []).some(
      (ur) => ur.role?.is_system === true,
    );

    if (hasSystemRole) {
      this.logger.log(`Applying system role bypass for user ${userId}`);
      // Asignar todos los permisos :manage (siempre, no solo si está vacío)
      const allResources = [
        'branches',
        'users',
        'roles',
        'categories',
        'products',
        'orders',
        'customers',
        'permissions',
        'modules',
      ];
      allResources.forEach((resource) => {
        permissions.push(`${resource}:manage`);
      });
    }

    // Warn if user has no permissions assigned (and is not system role)
    if (permissions.length === 0 && !hasSystemRole) {
      this.logger.warn(`User ${userId} has no permissions assigned`);
    }

    // Expand "manage" permissions to individual CRUD actions
    const expandedPermissions = this.expandManagePermissions([
      ...new Set(permissions),
    ]);

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      branch_id: user.branch_id,
      customer_id: user.customer?.id ?? null,
      is_owner: user.is_owner ?? false,
      is_active: user.is_active ?? true,
      roles: [...new Set(roles)],
      permissions: expandedPermissions,
    };
  }

  /**
   * Expand permissions with ":manage" action to individual CRUD actions.
   * Example: "branches:manage" -> ["branches:create", "branches:read", "branches:update", "branches:delete"]
   */
  private expandManagePermissions(permissions: string[]): string[] {
    const expanded: string[] = [];
    const crudActions = ['create', 'read', 'update', 'delete'];

    for (const permission of permissions) {
      if (permission.endsWith(':manage')) {
        const resource = permission.split(':')[0];
        for (const action of crudActions) {
          expanded.push(`${resource}:${action}`);
        }
      } else {
        expanded.push(permission);
      }
    }

    return [...new Set(expanded)];
  }

  /**
   * Normalize role names to lowercase for frontend compatibility
   */
  private normalizeRoleName(roleName: string | undefined): string | null {
    if (!roleName) return null;

    const roleMap: Record<string, string> = {
      ADMIN: 'super_admin',
      SUPER_ADMIN: 'super_admin',
      super_admin: 'super_admin',
      COORDINADOR: 'coordinador',
      Coordinador: 'coordinador',
      coordinador: 'coordinador',
      ADMINISTRADOR: 'administrador',
      Administrador: 'administrador',
      administrador: 'administrador',
      EMPLEADO: 'empleado',
      Empleado: 'empleado',
      empleado: 'empleado',
      REPARTIDOR: 'repartidor',
      Repartidor: 'repartidor',
      repartidor: 'repartidor',
      CUSTOMER: 'customer',
      customer: 'customer',
    };

    return roleMap[roleName] ?? roleName.toLowerCase();
  }
}
