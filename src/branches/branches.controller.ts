import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchScheduleDto } from './dto/create-branch-schedule.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBranchDto: CreateBranchDto, @Req() req: any) {
    const user = req.user || {};
    return this.branchesService.create(createBranchDto, user.id);
  }

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }

  @Get(':id/schedules')
  findSchedules(@Param('id') id: string) {
    return this.branchesService.findSchedules(id);
  }

  @Post(':id/schedules')
  upsertSchedule(
    @Param('id') id: string,
    @Body() dto: CreateBranchScheduleDto,
  ) {
    return this.branchesService.upsertSchedule(id, dto);
  }

  @Delete(':id/schedules/:scheduleId')
  removeSchedule(
    @Param('id') id: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.branchesService.removeSchedule(id, scheduleId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Query() query: DashboardQueryDto) {
    // Parse dates based on period or use provided dates
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (query.period) {
      const now = new Date();
      dateTo = now;

      switch (query.period) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    } else if (query.dateFrom || query.dateTo) {
      dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    }

    return this.branchesService.getDashboardMetrics(dateFrom, dateTo);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard)
  async getBranchDashboard(
    @Param('id') id: string,
    @Query() query: DashboardQueryDto,
  ) {
    // Parse dates based on period or use provided dates
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (query.period) {
      const now = new Date();
      dateTo = now;

      switch (query.period) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    } else if (query.dateFrom || query.dateTo) {
      dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    }

    return this.branchesService.getBranchDashboard(id, dateFrom, dateTo);
  }
}
