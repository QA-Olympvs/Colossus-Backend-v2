import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Business } from '../../business/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { UserRole } from './user-role.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column({ nullable: true })
  branch_id: string;

  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ length: 150 })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Business, (business) => business.users)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  user_roles: UserRole[];

  @OneToOne(() => Customer, (customer) => customer.user)
  customer: Customer;
}
