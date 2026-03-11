import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email, business_id: createUserDto.business_id },
    });
    if (existing) throw new ConflictException('User with this email already exists in this business');
    const hashed = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
    const user = this.userRepository.create({ ...createUserDto, password: hashed });
    return this.userRepository.save(user);
  }

  async findAll(businessId?: string): Promise<User[]> {
    const where: Record<string, unknown> = { is_active: true };
    if (businessId) where.business_id = businessId;
    return this.userRepository.find({ where, relations: ['user_roles', 'user_roles.role'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['business', 'branch', 'user_roles', 'user_roles.role'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async countByBusiness(businessId: string): Promise<number> {
    return this.userRepository.count({ where: { business_id: businessId, is_active: true } });
  }

  async findByEmail(email: string, businessId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, business_id: businessId, is_active: true },
      relations: ['user_roles', 'user_roles.role', 'user_roles.role.role_permissions', 'user_roles.role.role_permissions.permission'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.is_active = false;
    await this.userRepository.save(user);
  }

  async assignRole(userId: string, assignRoleDto: AssignRoleDto): Promise<UserRole> {
    const user = await this.findOne(userId);
    const existing = await this.userRoleRepository.findOne({
      where: { user: { id: user.id }, role: { id: assignRoleDto.role_id } },
    });
    if (existing) throw new ConflictException('Role already assigned to this user');
    const userRole = this.userRoleRepository.create({
      user: { id: userId },
      role: { id: assignRoleDto.role_id },
    });
    return this.userRoleRepository.save(userRole);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { user: { id: userId }, role: { id: roleId } },
    });
    if (!userRole) throw new NotFoundException('Role not assigned to this user');
    await this.userRoleRepository.remove(userRole);
  }
}
