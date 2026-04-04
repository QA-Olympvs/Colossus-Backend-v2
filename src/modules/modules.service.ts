import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Module } from './entities/module.entity';
import { RoleModule } from './entities/role-module.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AssignModuleDto } from './dto/assign-module.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(RoleModule)
    private readonly roleModuleRepository: Repository<RoleModule>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Module[]> {
    return this.moduleRepository.find({
      order: { order: 'ASC' },
    });
  }

  async findAllActive(): Promise<Module[]> {
    return this.moduleRepository.find({
      where: { is_active: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({ where: { id } });
    if (!module) throw new NotFoundException(`Module #${id} not found`);
    return module;
  }

  async findByRoles(roleNames: string[]): Promise<Module[]> {
    if (!roleNames || roleNames.length === 0) {
      return [];
    }

    // Map frontend role names (lowercase) to backend role names (as stored in DB)
    // Frontend: 'coordinador' -> Backend: 'Coordinador' (as in database)
    const backendRoleNames = roleNames.map((name) => {
      const roleMap: Record<string, string> = {
        super_admin: 'ADMIN',
        coordinador: 'Coordinador',
        administrador: 'Administrador',
        empleado: 'Empleado',
        repartidor: 'Repartidor',
        customer: 'Customer',
      };
      return roleMap[name] || name;
    });

    // Check if any of the user's roles is a system role
    const systemRole = await this.roleRepository.findOne({
      where: {
        name: In(backendRoleNames),
        is_system: true,
      },
    });

    // If user has a system role, return all active modules
    if (systemRole) {
      return this.moduleRepository.find({
        where: { is_active: true },
        order: { order: 'ASC' },
      });
    }

    // Otherwise, return only modules assigned to the user's roles
    const modules = await this.moduleRepository
      .createQueryBuilder('module')
      .innerJoin('module.role_modules', 'rm')
      .innerJoin('rm.role', 'role')
      .where('role.name IN (:...roleNames)', { roleNames: backendRoleNames })
      .andWhere('module.is_active = :isActive', { isActive: true })
      .orderBy('module.order', 'ASC')
      .getMany();

    return modules;
  }

  /**
   * Verifica si alguno de los roles proporcionados tiene acceso al módulo especificado.
   * Usa JOIN para evitar consultas N+1.
   */
  async hasModuleAccessForRoles(
    roleIds: string[],
    moduleName: string,
  ): Promise<boolean> {
    if (!roleIds.length) {
      return false;
    }

    const hasAccess = await this.roleModuleRepository
      .createQueryBuilder('rm')
      .innerJoin('rm.module', 'm')
      .where('rm.role_id IN (:...roleIds)', { roleIds })
      .andWhere('m.name = :moduleName', { moduleName })
      .getExists();

    return hasAccess;
  }

  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    const existing = await this.moduleRepository.findOne({
      where: { name: createModuleDto.name },
    });
    if (existing)
      throw new ConflictException(
        `Module '${createModuleDto.name}' already exists`,
      );

    const module = this.moduleRepository.create(createModuleDto);
    return this.moduleRepository.save(module);
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    const module = await this.findOne(id);
    Object.assign(module, updateModuleDto);
    return this.moduleRepository.save(module);
  }

  async remove(id: string): Promise<void> {
    const module = await this.findOne(id);
    await this.moduleRepository.remove(module);
  }

  async assignToRole(
    moduleId: string,
    assignModuleDto: AssignModuleDto,
  ): Promise<RoleModule> {
    const module = await this.findOne(moduleId);
    const role = await this.roleRepository.findOne({
      where: { id: assignModuleDto.role_id },
    });
    if (!role)
      throw new NotFoundException(`Role #${assignModuleDto.role_id} not found`);

    const existing = await this.roleModuleRepository.findOne({
      where: { role: { id: role.id }, module: { id: module.id } },
    });
    if (existing)
      throw new ConflictException('Module already assigned to this role');

    const roleModule = this.roleModuleRepository.create({
      role: { id: role.id },
      module: { id: module.id },
    });
    return this.roleModuleRepository.save(roleModule);
  }

  async removeFromRole(moduleId: string, roleId: string): Promise<void> {
    const roleModule = await this.roleModuleRepository.findOne({
      where: { role: { id: roleId }, module: { id: moduleId } },
    });
    if (!roleModule)
      throw new NotFoundException('Module not assigned to this role');
    await this.roleModuleRepository.remove(roleModule);
  }

  async getModulesForRole(roleId: string): Promise<Module[]> {
    const roleModules = await this.roleModuleRepository.find({
      where: { role: { id: roleId } },
      relations: ['module'],
    });
    return roleModules.map((rm) => rm.module);
  }

  async seedModules(): Promise<void> {
    const MODULES_SEED = [
      {
        name: 'orders',
        label: 'Órdenes',
        icon: 'pi-shopping-cart',
        route: '/dashboard/orders',
        order: 1,
      },
      {
        name: 'orders-history',
        label: 'Historial',
        icon: 'pi-history',
        route: '/dashboard/orders-history',
        order: 2,
      },
      {
        name: 'products',
        label: 'Productos',
        icon: 'pi-th-large',
        route: '/dashboard/products',
        order: 3,
      },
      {
        name: 'categories',
        label: 'Categorías',
        icon: 'pi-tag',
        route: '/dashboard/categories',
        order: 4,
      },
      {
        name: 'users',
        label: 'Usuarios',
        icon: 'pi-users',
        route: '/dashboard/users',
        order: 5,
      },
      {
        name: 'routes',
        label: 'Rutas',
        icon: 'pi-map',
        route: '/dashboard/routes',
        order: 6,
      },
      {
        name: 'delivery-routes',
        label: 'Repartidor',
        icon: 'pi-truck',
        route: '/dashboard/delivery-routes',
        order: 7,
        is_delivery_module: true,
      },
      {
        name: 'branches',
        label: 'Sucursales',
        icon: 'pi-building',
        route: '/dashboard/branches',
        order: 8,
      },
      {
        name: 'settings',
        label: 'Configuración',
        icon: 'pi-cog',
        route: '/dashboard/settings',
        order: 9,
      },
    ];

    // Create modules if they don't exist
    for (const moduleData of MODULES_SEED) {
      let module = await this.moduleRepository.findOne({
        where: { name: moduleData.name },
      });
      if (!module) {
        module = this.moduleRepository.create(moduleData);
        await this.moduleRepository.save(module);
      }
    }

    // Assign all modules to ADMIN role
    const adminRole = await this.roleRepository.findOne({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      const allModules = await this.moduleRepository.find();
      for (const module of allModules) {
        const existing = await this.roleModuleRepository.findOne({
          where: { role: { id: adminRole.id }, module: { id: module.id } },
        });
        if (!existing) {
          const roleModule = this.roleModuleRepository.create({
            role: { id: adminRole.id },
            module: { id: module.id },
          });
          await this.roleModuleRepository.save(roleModule);
        }
      }
    }
  }
}
