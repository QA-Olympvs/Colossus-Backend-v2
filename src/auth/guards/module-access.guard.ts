import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModulesService } from '../../modules/modules.service';
import { MODULE_ACCESS_KEY } from '../decorators/has-module-access.decorator';

/**
 * Guard que verifica si el usuario tiene acceso a un módulo específico.
 * Extrae los roles del JWT y consulta si alguno tiene acceso al módulo requerido.
 */
@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private modulesService: ModulesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay decorator @HasModuleAccess, permitir acceso
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Extraer IDs de roles del usuario (del JWT)
    const roleIds = user.roles?.map((role: { id: string }) => role.id) || [];

    if (!roleIds.length) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }

    // Verificar si algún rol del usuario tiene acceso al módulo
    const hasAccess = await this.modulesService.hasModuleAccessForRoles(
      roleIds,
      requiredModule,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `No tienes acceso al módulo requerido: ${requiredModule}`,
      );
    }

    return true;
  }
}
