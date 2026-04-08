import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Permission } from './permission.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('branch_permissions')
@Index(['branch_id', 'role_id', 'permission_id'], { unique: true })
export class BranchPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  branch_id: string;

  @Column()
  role_id: string;

  @Column()
  permission_id: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { nullable: false })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
