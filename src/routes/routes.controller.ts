import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStatusDto } from './dto/update-route-status.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';

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
    return this.routesService.updateStopStatus(
      id,
      stopId,
      updateStopStatusDto.status,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
