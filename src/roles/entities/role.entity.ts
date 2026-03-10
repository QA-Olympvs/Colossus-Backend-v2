import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../users/entities/user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  user_roles: UserRole[];
}
