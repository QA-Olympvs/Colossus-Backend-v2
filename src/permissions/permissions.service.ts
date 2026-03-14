import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission, PermissionAction, PermissionResource } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { BranchPermission } from './entities/branch-permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(BranchPermission)
    private readonly branchPermissionRepository: Repository<BranchPermission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: { action: createPermissionDto.action, resource: createPermissionDto.resource },
    });
    if (existing) throw new ConflictException(`Permission '${createPermissionDto.resource}:${createPermissionDto.action}' already exists`);
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission #${id} not found`);
    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  async assignToRole(roleId: string, assignPermissionDto: AssignPermissionDto): Promise<RolePermission> {
    const permission = await this.findOne(assignPermissionDto.permission_id);
    const existing = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permission.id } },
    });
    if (existing) throw new ConflictException('Permission already assigned to this role');
    const rolePermission = this.rolePermissionRepository.create({
      role: { id: roleId },
      permission: { id: assignPermissionDto.permission_id },
    });
    return this.rolePermissionRepository.save(rolePermission);
  }

  async removeFromRole(roleId: string, permissionId: string): Promise<void> {
    const rp = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });
    if (!rp) throw new NotFoundException('Permission not assigned to this role');
    await this.rolePermissionRepository.remove(rp);
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  async seedAllPermissions(): Promise<Permission[]> {
    const actions = Object.values(PermissionAction);
    const resources = Object.values(PermissionResource);
    const permissions: Permission[] = [];
    for (const resource of resources) {
      for (const action of actions) {
        let permission = await this.permissionRepository.findOne({ where: { action, resource } });
        if (!permission) {
          permission = await this.permissionRepository.save(
            this.permissionRepository.create({ action, resource }),
          );
        }
        permissions.push(permission);
      }
    }
    return permissions;
  }

  async assignManagePermissionsToRole(roleId: string): Promise<void> {
    const resources = Object.values(PermissionResource);
    for (const resource of resources) {
      const permission = await this.permissionRepository.findOne({
        where: { action: PermissionAction.MANAGE, resource },
      });
      if (!permission) continue;
      
      const existing = await this.rolePermissionRepository.findOne({
        where: { role: { id: roleId }, permission: { id: permission.id } },
      });
      if (!existing) {
        await this.rolePermissionRepository.save(
          this.rolePermissionRepository.create({
            role: { id: roleId },
            permission: { id: permission.id },
          }),
        );
      }
    }
  }

  async assignManagePermissionsToRoleForBranch(roleId: string, branchId: string): Promise<void> {
    const resources = Object.values(PermissionResource);
    for (const resource of resources) {
      const permission = await this.permissionRepository.findOne({
        where: { action: PermissionAction.MANAGE, resource },
      });
      if (!permission) continue;
      
      const existing = await this.branchPermissionRepository.findOne({
        where: { role: { id: roleId }, permission: { id: permission.id }, branch: { id: branchId } },
      });
      if (!existing) {
        await this.branchPermissionRepository.save(
          this.branchPermissionRepository.create({
            role: { id: roleId },
            permission: { id: permission.id },
            branch: { id: branchId },
          }),
        );
      }
    }
  }

  async getPermissionsForRoleInBranch(roleId: string, branchId: string): Promise<Permission[]> {
    const branchPermissions = await this.branchPermissionRepository.find({
      where: { role: { id: roleId }, branch: { id: branchId } },
      relations: ['permission'],
    });
    return branchPermissions.map((bp) => bp.permission);
  }
}
