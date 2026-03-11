import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No authenticated user');

    const userRoles: string[] = user.roles ?? [];
    if (userRoles.includes('ADMIN')) return true;

    const userPermissions: string[] = user.permissions ?? [];

    const hasAll = required.every(
      (perm) => userPermissions.includes(perm) || userPermissions.includes(`${perm.split(':')[0]}:manage`),
    );

    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
