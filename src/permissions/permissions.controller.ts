import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Permissions('permissions:create')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Permissions('permissions:read')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Permissions('permissions:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Permissions('permissions:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Permissions('permissions:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Permissions('roles:update')
  @Post('roles/:roleId/assign')
  assignToRole(
    @Param('roleId') roleId: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.permissionsService.assignToRole(roleId, assignPermissionDto);
  }

  @Permissions('roles:update')
  @Delete('roles/:roleId/permissions/:permissionId')
  removeFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.permissionsService.removeFromRole(roleId, permissionId);
  }

  @Permissions('roles:read')
  @Get('roles/:roleId')
  getPermissionsForRole(@Param('roleId') roleId: string, @Req() req: any) {
    const branchId: string = req.user.branch_id as string;
    return this.permissionsService.getPermissionsForRoleInBranch(
      roleId,
      branchId,
    );
  }
}
