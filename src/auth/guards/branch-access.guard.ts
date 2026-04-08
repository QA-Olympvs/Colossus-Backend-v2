import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetBranchId =
      request.params.branchId ||
      request.query.branchId ||
      request.body.branch_id;

    // Si el usuario no tiene branch_id, es un usuario global (acceso a todo)
    if (!user.branch_id) {
      return true;
    }

    // Si el usuario tiene branch_id, solo puede acceder a su sucursal
    if (targetBranchId && user.branch_id !== targetBranchId) {
      throw new ForbiddenException(
        'You can only access resources from your assigned branch',
      );
    }

    return true;
  }
}
