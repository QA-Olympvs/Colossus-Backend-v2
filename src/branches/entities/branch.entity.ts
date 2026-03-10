import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  business_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, length: 150 })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Business, (business) => business.branches)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => Product, (product) => product.branch)
  products: Product[];
}
