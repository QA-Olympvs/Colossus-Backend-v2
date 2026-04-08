import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../users/entities/user-role.entity';
import { BranchPermission } from '../../permissions/entities/branch-permission.entity';

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

  @OneToMany(() => BranchPermission, (bp) => bp.role)
  branch_permissions: BranchPermission[];
}
