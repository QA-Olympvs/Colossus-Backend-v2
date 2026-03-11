import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PermissionAction, PermissionResource } from '../entities/permission.entity';

export class CreatePermissionDto {
  @IsEnum(PermissionAction)
  @IsNotEmpty()
  action: PermissionAction;

  @IsEnum(PermissionResource)
  @IsNotEmpty()
  resource: PermissionResource;

  @IsString()
  @IsOptional()
  description?: string;
}
