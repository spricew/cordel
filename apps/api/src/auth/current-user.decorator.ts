import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './session.guard.js';

// Saca el usuario que el guard pegó al request. Si el guard pasó,
// el usuario existe sí o sí; si alguien lo usa sin guard, falla claro.
export interface CurrentUserData {
  id: string;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserData => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user === undefined) {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }
    return request.user;
  },
);
