import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchScheduleDto } from './dto/create-branch-schedule.dto';

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
  upsertSchedule(@Param('id') id: string, @Body() dto: CreateBranchScheduleDto) {
    return this.branchesService.upsertSchedule(id, dto);
  }

  @Delete(':id/schedules/:scheduleId')
  removeSchedule(@Param('id') id: string, @Param('scheduleId') scheduleId: string) {
    return this.branchesService.removeSchedule(id, scheduleId);
  }
}
