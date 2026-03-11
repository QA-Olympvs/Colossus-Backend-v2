import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('customer_directions')
export class CustomerDirection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customer_id: string;

  @Column({ length: 150 })
  recipient_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 200 })
  street: string;

  @Column({ length: 20, nullable: true })
  ext_number: string;

  @Column({ length: 20, nullable: true })
  int_number: string;

  @Column({ length: 120, nullable: true })
  neighborhood: string;

  @Column({ length: 120 })
  city: string;

  @Column({ length: 120 })
  state: string;

  @Column({ length: 20 })
  postal_code: string;

  @Column({ length: 120, default: 'Mexico' })
  country: string;

  @Column({ nullable: true, type: 'text' })
  reference: string;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Customer, (customer) => customer.directions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
