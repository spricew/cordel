import { Inject, Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CONNECTION } from './queue.tokens.js';

/* Rate limiting del login contra Redis: 5 fallos por email en 15
 * minutos → 429. INCR + EXPIRE en una "ventana fija": el contador
 * nace con el primer fallo y muere 15 min después, haya o no más
 * fallos. Un login exitoso limpia el contador (del propio email). */
const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60;

@Injectable()
export class RateLimitService {
  public constructor(@Inject(REDIS_CONNECTION) private readonly redis: Redis) {}

  private key(email: string): string {
    return `rl:login:${email.toLowerCase()}`;
  }

  // Se llama ANTES de verificar credenciales: si el email ya quemó sus
  // intentos, ni siquiera se mira la contraseña.
  public async allowLoginAttempt(email: string): Promise<void> {
    const fails = await this.redis.get(this.key(email));
    if (fails !== null && Number(fails) >= MAX_FAILURES) {
      throw new HttpException(
        'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
        429,
      );
    }
  }

  public async registerLoginFailure(email: string): Promise<void> {
    const key = this.key(email);
    const fails = await this.redis.incr(key);
    if (fails === 1) {
      await this.redis.expire(key, WINDOW_SECONDS);
    }
  }

  public async registerLoginSuccess(email: string): Promise<void> {
    await this.redis.del(this.key(email));
  }
}
