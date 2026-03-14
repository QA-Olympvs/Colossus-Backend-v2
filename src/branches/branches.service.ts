import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { BranchSchedule, DayOfWeek } from './entities/branch-schedule.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchScheduleDto } from './dto/create-branch-schedule.dto';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(BranchSchedule)
    private readonly scheduleRepository: Repository<BranchSchedule>,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(createBranchDto: CreateBranchDto, userId?: string): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    const savedBranch = await this.branchRepository.save(branch);
    
    // Crear horarios por defecto
    await this.createDefaultSchedules(savedBranch.id);
    
    // Si hay userId, verificar si es owner y asignar permisos
    if (userId) {
      const user = await this.usersService.findOne(userId);
      
      if (user?.is_owner) {
        // Obtener roles del usuario que tengan permisos de administración
        const adminRoles = user.user_roles
          ?.filter(ur => ur.role?.name === 'ADMIN' || ur.role?.is_system)
          ?.map(ur => ur.role) || [];
        
        // Asignar permisos por sucursal a cada rol de admin del owner
        for (const role of adminRoles) {
          await this.permissionsService.assignManagePermissionsToRoleForBranch(role.id, savedBranch.id);
        }
      }
    }
    
    return savedBranch;
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id }, relations: ['schedules'] });
    if (!branch) throw new NotFoundException(`Branch #${id} not found`);
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    branch.is_active = false;
    await this.branchRepository.save(branch);
  }

  async findSchedules(branchId: string): Promise<BranchSchedule[]> {
    await this.findOne(branchId);
    return this.scheduleRepository.find({ where: { branch_id: branchId } });
  }

  async upsertSchedule(branchId: string, dto: CreateBranchScheduleDto): Promise<BranchSchedule> {
    await this.findOne(branchId);
    let schedule = await this.scheduleRepository.findOne({
      where: { branch_id: branchId, day_of_week: dto.day_of_week },
    });
    if (schedule) {
      Object.assign(schedule, dto);
    } else {
      schedule = this.scheduleRepository.create({ ...dto, branch_id: branchId });
    }
    return this.scheduleRepository.save(schedule);
  }

  async removeSchedule(branchId: string, scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, branch_id: branchId },
    });
    if (!schedule) throw new NotFoundException(`Schedule #${scheduleId} not found for this branch`);
    await this.scheduleRepository.remove(schedule);
  }

  async createDefaultSchedules(branchId: string): Promise<BranchSchedule[]> {
    // Verificar si ya existen horarios para esta sucursal
    const existingSchedules = await this.scheduleRepository.find({
      where: { branch_id: branchId }
    });
    
    if (existingSchedules.length > 0) {
      return existingSchedules; // Ya existen, retornar los existentes
    }
    
    const weekDays: DayOfWeek[] = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
    const weekendDays: DayOfWeek[] = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];
    
    const schedules: BranchSchedule[] = [];
    
    // Lunes-Viernes: 8:00-22:00
    for (const day of weekDays) {
      const schedule = this.scheduleRepository.create({
        branch_id: branchId,
        day_of_week: day,
        open_time: '08:00',
        close_time: '20:00',
        is_closed: false,
      });
      schedules.push(schedule);
    }
    
    // Sábado-Domingo: Cerrado
    for (const day of weekendDays) {
      const schedule = this.scheduleRepository.create({
        branch_id: branchId,
        day_of_week: day,
        is_closed: true,
      });
      schedules.push(schedule);
    }
    
    return this.scheduleRepository.save(schedules);
  }
}
