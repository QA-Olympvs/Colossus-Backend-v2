import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.role_permissions, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
