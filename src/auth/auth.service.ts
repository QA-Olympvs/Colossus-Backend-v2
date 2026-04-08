import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { BranchesModule } from '../branches/branches.module';
import { BranchesService } from '../branches/branches.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
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
    const roles = (user.user_roles ?? []).map((ur) => ur.role?.name).filter(Boolean);
    
    // Obtener branch_id del usuario
    const branch_id = user.branch_id;
    
    // Obtener permisos por sucursal (solo se usa branch_permissions ahora)
    const permissions = (user.user_roles ?? [])
      .flatMap((ur) => {
        // Todos los usuarios ahora requieren branch_id
        if (branch_id) {
          return ur.role?.branch_permissions
            ?.filter((bp: any) => bp.branch_id === branch_id)
            ?.map((bp: any) => bp.permission) ?? [];
        } else {
          // Si no hay branch_id, no hay permisos
          return [];
        }
      })
      .filter(Boolean)
      .map((p: any) => `${p.resource}:${p.action}`);
    
    const payload = {
      sub: user.id,
      email: user.email,
      branch_id,
      roles,
      permissions: [...new Set(permissions)],
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const token = this.buildToken(user);
    const { password: _pw, ...userWithoutPassword } = user as User & { password: string };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new ConflictException('User with this email already exists');

    const isFirstUser = (await this.usersService.findAll()).length === 0;
    const user = await this.usersService.create(registerDto);

    if (isFirstUser) {
      const adminRole = await this.rolesService.findOrCreate('ADMIN', 'Super administrator with full access', true);
      await this.permissionsService.seedAllPermissions();
      
      // Crear sucursal principal con datos del request
      const mainBranch = await this.branchesService.create({
        name: registerDto.branch_name ?? `Sucursal de ${user.first_name} ${user.last_name}`,
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
      await this.permissionsService.assignManagePermissionsToRoleForBranch(adminRole.id, mainBranch.id);
      await this.usersService.assignRole(user.id, { role_id: adminRole.id });
    }

    const freshUser = await this.usersService.findByEmail(user.email) as User;
    const token = this.buildToken(freshUser);
    const { password: _pw, ...userWithoutPassword } = freshUser as User & { password: string };
    return { ...token, user: userWithoutPassword as Omit<User, 'password'> };
  }
}
