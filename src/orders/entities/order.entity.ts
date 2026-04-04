import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerDirection } from '../../customer-directions/entities/customer-direction.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
  DINE_IN = 'dine_in',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  order_number: string;

  @Column()
  branch_id: string;

  @Column({ nullable: true })
  customer_id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  delivery_address_id: string;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.PICKUP })
  type: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true, type: 'text' })
  cancelled_reason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ nullable: true })
  cancelled_at: Date;

  @Column({ nullable: true })
  delivered_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true, type: 'text', name: 'delivery_photo_url' })
  delivery_photo_url: string;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CustomerDirection, { nullable: true })
  @JoinColumn({ name: 'delivery_address_id' })
  delivery_address: CustomerDirection;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];
}
