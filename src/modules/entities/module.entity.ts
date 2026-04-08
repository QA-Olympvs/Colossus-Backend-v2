import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleModule } from './role-module.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  label: string;

  @Column()
  icon: string;

  @Column()
  route: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  is_delivery_module: boolean;

  @Column({ nullable: true })
  parent_module_id: string;

  @OneToMany(() => RoleModule, (roleModule) => roleModule.module)
  role_modules: RoleModule[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
