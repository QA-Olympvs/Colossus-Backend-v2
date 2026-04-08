import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { BranchSchedule, DayOfWeek } from './entities/branch-schedule.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchScheduleDto } from './dto/create-branch-schedule.dto';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import {
  BranchDashboardResponseDto,
  BranchMetricDto,
  BranchAlertDto,
  SingleBranchDashboardResponseDto,
} from './dto/branch-dashboard-response.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(BranchSchedule)
    private readonly scheduleRepository: Repository<BranchSchedule>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    createBranchDto: CreateBranchDto,
    userId?: string,
  ): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    const savedBranch = await this.branchRepository.save(branch);

    // Crear horarios por defecto
    await this.createDefaultSchedules(savedBranch.id);

    // Si hay userId, verificar si es owner y asignar permisos
    if (userId) {
      const user = await this.usersService.findOne(userId);

      if (user?.is_owner) {
        // Obtener roles del usuario que tengan permisos de administración
        const adminRoles =
          user.user_roles
            ?.filter((ur) => ur.role?.name === 'ADMIN' || ur.role?.is_system)
            ?.map((ur) => ur.role) || [];

        // Asignar permisos por sucursal a cada rol de admin del owner
        for (const role of adminRoles) {
          await this.permissionsService.assignManagePermissionsToRoleForBranch(
            role.id,
            savedBranch.id,
          );
        }
      }
    }

    return savedBranch;
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['schedules'],
    });
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

  async upsertSchedule(
    branchId: string,
    dto: CreateBranchScheduleDto,
  ): Promise<BranchSchedule> {
    await this.findOne(branchId);
    let schedule = await this.scheduleRepository.findOne({
      where: { branch_id: branchId, day_of_week: dto.day_of_week },
    });
    if (schedule) {
      Object.assign(schedule, dto);
    } else {
      schedule = this.scheduleRepository.create({
        ...dto,
        branch_id: branchId,
      });
    }
    return this.scheduleRepository.save(schedule);
  }

  async removeSchedule(branchId: string, scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, branch_id: branchId },
    });
    if (!schedule)
      throw new NotFoundException(
        `Schedule #${scheduleId} not found for this branch`,
      );
    await this.scheduleRepository.remove(schedule);
  }

  async createDefaultSchedules(branchId: string): Promise<BranchSchedule[]> {
    // Verificar si ya existen horarios para esta sucursal
    const existingSchedules = await this.scheduleRepository.find({
      where: { branch_id: branchId },
    });

    if (existingSchedules.length > 0) {
      return existingSchedules; // Ya existen, retornar los existentes
    }

    const weekDays: DayOfWeek[] = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];
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

  async getDashboardMetrics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<BranchDashboardResponseDto> {
    // Default to last 30 days if no dates provided
    const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dateTo || new Date();

    // Get all active branches
    const branches = await this.branchRepository.find({
      where: { is_active: true },
    });

    const branchMetrics: BranchMetricDto[] = [];
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const branch of branches) {
      // Get orders for this branch in date range
      const orders = await this.orderRepository.find({
        where: {
          branch_id: branch.id,
          created_at: Between(from, to),
          is_archived: false,
        },
      });

      const ordersCount = orders.length;
      const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

      const deliveredOrders = orders.filter(
        (o) => o.status === OrderStatus.DELIVERED,
      ).length;
      const completionRate =
        ordersCount > 0 ? Math.round((deliveredOrders / ordersCount) * 100) : 0;

      // Calculate on-time rate (assume 30 min default delivery time)
      const onTimeOrders = orders.filter((o) => {
        if (o.status !== OrderStatus.DELIVERED || !o.delivered_at) return false;
        const estimatedDelivery = new Date(
          o.created_at.getTime() + 30 * 60 * 1000,
        );
        return o.delivered_at <= estimatedDelivery;
      }).length;
      const onTimeRate =
        deliveredOrders > 0
          ? Math.round((onTimeOrders / deliveredOrders) * 100)
          : 0;

      // Determine status
      let status: 'excellent' | 'good' | 'warning' = 'warning';
      if (completionRate >= 95 && onTimeRate >= 90) {
        status = 'excellent';
      } else if (completionRate >= 85 && onTimeRate >= 80) {
        status = 'good';
      }

      branchMetrics.push({
        branchId: branch.id,
        branchName: branch.name,
        orders: ordersCount,
        revenue: Math.round(revenue * 100) / 100,
        avgTicket: Math.round(avgTicket * 100) / 100,
        completionRate,
        onTimeRate,
        status,
      });

      totalOrders += ordersCount;
      totalRevenue += revenue;
    }

    // Sort by revenue to find best/lowest
    const sortedByRevenue = [...branchMetrics].sort(
      (a, b) => b.revenue - a.revenue,
    );
    const bestBranchId =
      sortedByRevenue.length > 0 ? sortedByRevenue[0].branchId : null;
    const lowestBranchId =
      sortedByRevenue.length > 0
        ? sortedByRevenue[sortedByRevenue.length - 1].branchId
        : null;

    // Calculate global average ticket
    const avgTicket =
      totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0;

    // Generate alerts
    const alerts = this.generateAlerts(branchMetrics);

    return {
      global: {
        totalBranches: branches.length,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgTicket,
        bestBranchId,
        lowestBranchId,
      },
      branches: branchMetrics,
      alerts,
    };
  }

  async getBranchDashboard(
    branchId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<SingleBranchDashboardResponseDto> {
    const branch = await this.findOne(branchId);

    // Default to last 7 days for trends
    const from = dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = dateTo || new Date();

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Orders today
    const todayOrders = await this.orderRepository.find({
      where: {
        branch_id: branchId,
        created_at: Between(today, tomorrow),
        is_archived: false,
      },
    });

    const ordersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    // All orders in range for metrics
    const orders = await this.orderRepository.find({
      where: {
        branch_id: branchId,
        created_at: Between(from, to),
        is_archived: false,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgTicket =
      totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0;

    // Completion rate
    const deliveredOrders = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    ).length;
    const completionRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    // On-time rate (assume 30 min default delivery time)
    const onTimeOrders = orders.filter((o) => {
      if (o.status !== OrderStatus.DELIVERED || !o.delivered_at) return false;
      const estimatedDelivery = new Date(
        o.created_at.getTime() + 30 * 60 * 1000,
      );
      return o.delivered_at <= estimatedDelivery;
    }).length;
    const onTimeRate =
      deliveredOrders > 0
        ? Math.round((onTimeOrders / deliveredOrders) * 100)
        : 0;

    // Cancellation rate
    const cancelledOrders = orders.filter(
      (o) =>
        o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REFUNDED,
    ).length;
    const cancellationRate =
      totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    // Weekly trend
    const weeklyTrend: SingleBranchDashboardResponseDto['weeklyTrend'] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = orders.filter(
        (o) => o.created_at >= date && o.created_at < nextDate,
      );

      weeklyTrend.push({
        day: dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenue:
          Math.round(
            dayOrders.reduce((sum, o) => sum + Number(o.total), 0) * 100,
          ) / 100,
      });
    }

    // Recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        status: o.status,
        total_amount: Number(o.total),
        created_at: o.created_at.toISOString(),
      }));

    return {
      branchId: branch.id,
      branchName: branch.name,
      kpis: {
        ordersToday,
        revenueToday: Math.round(revenueToday * 100) / 100,
        avgTicket,
        activeStaff: 0, // TODO: implement when staff tracking is available
        completionRate,
        onTimeRate,
        cancellationRate,
      },
      weeklyTrend,
      recentOrders,
    };
  }

  private generateAlerts(branches: BranchMetricDto[]): BranchAlertDto[] {
    const alerts: BranchAlertDto[] = [];

    branches.forEach((branch, index) => {
      // Alert for low completion rate
      if (branch.completionRate < 85) {
        alerts.push({
          id: `alert-${branch.branchId}-completion`,
          branchId: branch.branchId,
          branchName: branch.branchName,
          level: 'danger',
          title: 'Bajo cumplimiento',
          detail: `Solo ${branch.completionRate}% de órdenes completadas`,
        });
      } else if (branch.completionRate < 95) {
        alerts.push({
          id: `alert-${branch.branchId}-completion`,
          branchId: branch.branchId,
          branchName: branch.branchName,
          level: 'warn',
          title: 'Cumplimiento regular',
          detail: `${branch.completionRate}% de órdenes completadas`,
        });
      }

      // Alert for low on-time rate
      if (branch.onTimeRate < 80) {
        alerts.push({
          id: `alert-${branch.branchId}-ontime`,
          branchId: branch.branchId,
          branchName: branch.branchName,
          level: 'danger',
          title: 'Baja puntualidad',
          detail: `Solo ${branch.onTimeRate}% de entregas a tiempo`,
        });
      } else if (branch.onTimeRate < 90) {
        alerts.push({
          id: `alert-${branch.branchId}-ontime`,
          branchId: branch.branchId,
          branchName: branch.branchName,
          level: 'warn',
          title: 'Puntualidad regular',
          detail: `${branch.onTimeRate}% de entregas a tiempo`,
        });
      }

      // Alert for no orders
      if (branch.orders === 0) {
        alerts.push({
          id: `alert-${branch.branchId}-noorders`,
          branchId: branch.branchId,
          branchName: branch.branchName,
          level: 'info',
          title: 'Sin órdenes',
          detail: 'No se registraron órdenes en el período',
        });
      }
    });

    return alerts;
  }
}
