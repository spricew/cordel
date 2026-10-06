import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../prisma/generated/client.js';

// Puerta de la API a Postgres. Extiende el cliente generado con el ciclo
// de vida de Nest: conecta al arrancar y cierra pool + cliente al apagar.
// La URL ya viene validada por env.validation.ts, por eso getOrThrow.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  public constructor(private readonly config: ConfigService) {
    const pool = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
