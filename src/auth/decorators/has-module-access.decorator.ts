import { SetMetadata } from '@nestjs/common';

export const MODULE_ACCESS_KEY = 'moduleAccess';

/**
 * Decorador para proteger endpoints que requieren acceso a un módulo específico.
 * El guard ModuleAccessGuard verificará si el usuario tiene algún rol con acceso al módulo.
 *
 * @example
 * @UseGuards(JwtAuthGuard, ModuleAccessGuard)
 * @HasModuleAccess('delivery-routes')
 * async assignRoute(@Body() dto: AssignRouteDto) { ... }
 */
export const HasModuleAccess = (moduleName: string) =>
  SetMetadata(MODULE_ACCESS_KEY, moduleName);
