import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface HealthResponse {
  status: string;
  database: string;
}

// GET /api/v1/health. Prueba que la API respira y que Postgres responde.
// Si la base está caída, el query explota y el filtro global devuelve
// el 500 con forma pareja (no un "ok" mentiroso).
@Controller('health')
export class HealthController {
  public constructor(private readonly prisma: PrismaService) {}

  @Get()
  public async check(): Promise<HealthResponse> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }
}
