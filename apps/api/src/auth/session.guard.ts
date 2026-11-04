import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; name: string };
  sessionToken?: string;
}

const INVALID_SESSION_MESSAGE = 'Sesión inválida o vencida';

@Injectable()
export class SessionGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) {
      return true;
    }

    // Saca el token del header "Authorization: Bearer <token>".
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token =
      header !== undefined && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : undefined;
    if (token === undefined || token === '') {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (session === null) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    // Revisa vencimiento. Vencida = se borra + 401.
    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.session.delete({ where: { token } });
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
    request.sessionToken = token;
    return true;
  }
}
