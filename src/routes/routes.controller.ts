import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStatusDto } from './dto/update-route-status.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { HasModuleAccess } from '../auth/decorators/has-module-access.decorator';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  findAll(@Query('businessId') businessId?: string) {
    return this.routesService.findAll(businessId);
  }

  @Get('delivery-user/:userId')
  findByAssignedUser(@Param('userId') userId: string) {
    return this.routesService.findByAssignedUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ModuleAccessGuard)
  @HasModuleAccess('delivery-routes')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(id, updateRouteDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRouteStatusDto,
  ) {
    return this.routesService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/stops/:stopId/status')
  updateStopStatus(
    @Param('id') id: string,
    @Param('stopId') stopId: string,
    @Body() updateStopStatusDto: UpdateStopStatusDto,
  ) {
    return this.routesService.updateStopStatus(id, stopId, updateStopStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
