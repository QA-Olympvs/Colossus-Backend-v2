import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export enum PermissionResource {
  BRANCHES = 'branches',
  BRANCH_SCHEDULES = 'branch_schedules',
  USERS = 'users',
  ROLES = 'roles',
  CATEGORIES = 'categories',
  PRODUCTS = 'products',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  CUSTOMER_DIRECTIONS = 'customer_directions',
  PERMISSIONS = 'permissions',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PermissionAction })
  action: PermissionAction;

  @Column({ type: 'enum', enum: PermissionResource })
  resource: PermissionResource;

  @Column({ nullable: true, type: 'text' })
  description: string;

  get key(): string {
    return `${this.resource}:${this.action}`;
  }
}
