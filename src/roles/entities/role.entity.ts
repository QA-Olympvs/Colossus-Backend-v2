import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../users/entities/user-role.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { BranchPermission } from '../../permissions/entities/branch-permission.entity';
import { RoleModule } from '../../modules/entities/role-module.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: false })
  is_system: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  user_roles: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  role_permissions: RolePermission[];

  @OneToMany(() => BranchPermission, (bp) => bp.role)
  branch_permissions: BranchPermission[];

  @OneToMany(() => RoleModule, (rm) => rm.role)
  role_modules: RoleModule[];
}
