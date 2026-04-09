import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { AssignModuleDto } from './dto/assign-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

interface AuthenticatedRequest {
  user: {
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
  };
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('modules')
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  // Endpoint público para el dashboard del usuario - solo requiere JWT
  @UseGuards(JwtAuthGuard)
  @Get('dashboard-modules')
  async getDashboardModules(@Request() req: AuthenticatedRequest) {
    const userRoles = req.user?.roles ?? [];
    return this.modulesService.findByRoles(userRoles);
  }

  @Permissions('modules:create')
  @Post()
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Permissions('modules:read')
  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Permissions('modules:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Permissions('modules:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Permissions('modules:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }

  @Permissions('modules:update')
  @Post(':id/assign-role')
  assignToRole(
    @Param('id') id: string,
    @Body() assignModuleDto: AssignModuleDto,
  ) {
    return this.modulesService.assignToRole(id, assignModuleDto);
  }

  @Permissions('modules:update')
  @Delete(':id/remove-role/:roleId')
  removeFromRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.modulesService.removeFromRole(id, roleId);
  }

  @Permissions('roles:read')
  @Get(':id/roles')
  async getModulesForRole(@Param('id') id: string) {
    return this.modulesService.getModulesForRole(id);
  }
}
