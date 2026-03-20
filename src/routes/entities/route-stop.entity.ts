import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryRoute } from './delivery-route.entity';
import { CustomerDirection } from '../../customer-directions/entities/customer-direction.entity';

@Entity('route_stops')
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  route_id: string;

  @Column({ nullable: true })
  customer_direction_id: string;

  // TODO: Uncomment when orders module is implemented
  // @Column({ nullable: true })
  // order_id: string;

  @Column({ type: 'int' })
  stop_order: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'skipped'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => DeliveryRoute, (route) => route.stops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_id' })
  route: DeliveryRoute;

  @ManyToOne(() => CustomerDirection, { nullable: true })
  @JoinColumn({ name: 'customer_direction_id' })
  customer_direction: CustomerDirection;

  // TODO: Uncomment when orders module is implemented
  // @ManyToOne(() => Order, { nullable: true })
  // @JoinColumn({ name: 'order_id' })
  // order: Order;
}
