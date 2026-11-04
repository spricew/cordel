import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './session.guard.js';

// Saca el token Bearer ya validado por el guard. Si el guard pasó,
// el token existe sí o sí; si alguien usa esto sin guard, falla claro.
export const SessionToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.sessionToken === undefined || request.sessionToken === '') {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }
    return request.sessionToken;
  },
);
