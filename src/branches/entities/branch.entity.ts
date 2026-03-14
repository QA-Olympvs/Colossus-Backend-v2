import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { BranchSchedule } from './branch-schedule.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, length: 150 })
  email: string;

  @Column({ nullable: true, length: 13 })
  rfc: string;

  @Column({ default: true })
  is_accepting_orders: boolean;

  @Column({ default: false })
  has_delivery: boolean;

  @Column({ default: true })
  has_pickup: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  delivery_fee: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  delivery_min_amount: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  delivery_radius_km: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => Product, (product) => product.branch)
  products: Product[];

  @OneToMany(() => BranchSchedule, (schedule) => schedule.branch)
  schedules: BranchSchedule[];
}
