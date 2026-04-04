import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Module } from './module.entity';

@Entity('role_modules')
export class RoleModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.role_modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Module, (module) => module.role_modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @CreateDateColumn()
  created_at: Date;
}
