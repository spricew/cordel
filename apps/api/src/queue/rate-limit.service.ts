import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CONNECTION } from './queue.tokens.js';

/* Rate limiting contra Redis (ventana fija con INCR + EXPIRE):
 * - Login: 5 fallos por email en 15 minutos → 429.
 * - Aceptar invitación: 10 fallos por usuario en 15 minutos → 429
 *   para impedir fuerza bruta o sondeo de tokens. */
const LOGIN_MAX_FAILURES = 5;
const INVITE_ACCEPT_MAX_FAILURES = 10;
const WINDOW_SECONDS = 15 * 60;

@Injectable()
export class RateLimitService {
  public constructor(@Inject(REDIS_CONNECTION) private readonly redis: Redis) {}

  private loginKey(email: string): string {
    return `rl:login:${email.toLowerCase()}`;
  }

  private inviteAcceptKey(userId: string): string {
    return `rl:invite-accept:${userId}`;
  }

  private async assertBelowLimit(key: string, maxFailures: number): Promise<void> {
    const fails = await this.redis.get(key);
    if (fails !== null && Number(fails) >= maxFailures) {
      throw new HttpException(
        'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
        429,
      );
    }
  }

  private async incrementFailure(key: string): Promise<void> {
    const fails = await this.redis.incr(key);
    if (fails === 1) {
      await this.redis.expire(key, WINDOW_SECONDS);
    }
  }

  // Se llama ANTES de verificar credenciales: si el email ya quemó sus
  // intentos, ni siquiera se mira la contraseña.
  public async allowLoginAttempt(email: string): Promise<void> {
    await this.assertBelowLimit(this.loginKey(email), LOGIN_MAX_FAILURES);
  }

  public async registerLoginFailure(email: string): Promise<void> {
    await this.incrementFailure(this.loginKey(email));
  }

  public async registerLoginSuccess(email: string): Promise<void> {
    await this.redis.del(this.loginKey(email));
  }

  public async allowInviteAcceptAttempt(userId: string): Promise<void> {
    await this.assertBelowLimit(this.inviteAcceptKey(userId), INVITE_ACCEPT_MAX_FAILURES);
  }

  public async registerInviteAcceptFailure(userId: string): Promise<void> {
    await this.incrementFailure(this.inviteAcceptKey(userId));
  }

  public async registerInviteAcceptSuccess(userId: string): Promise<void> {
    await this.redis.del(this.inviteAcceptKey(userId));
  }
}
