import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { randomUUID } from 'crypto';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
}

export interface LoggedUser extends RegisteredUser {
  token: string;
  expiresAt: Date;
}

// La lógica del registro. Recibe datos ya validados (el DTO pasó el
// ValidationPipe) y devuelve al usuario SIN el hash: el hash jamás sale.
@Injectable()
export class AuthService {
  public constructor(private readonly prisma: PrismaService) {}

  public async register(dto: RegisterDto): Promise<RegisteredUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing !== null) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });
    return { id: user.id, email: user.email, name: user.name };
  }

  public async login(dto: LoginDto): Promise<LoggedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }
}
