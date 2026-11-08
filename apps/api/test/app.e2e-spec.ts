import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Réplica del bootstrap de main.ts (el TestingModule no pasa por
    // bootstrap()): sin el prefijo ni el filtro, este harness probaría
    // otra API distinta a la desplegada.
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/health público responde 200', async () => {
    const server = app.getHttpServer() as Server;

    // /health es @Public: responde sin sesión. Alcanza como humo
    // (smoke) de que la App completa arrancó con sus guards y pipes.
    const res = await request(server).get('/api/v1/health');

    expect(res.status).toBe(200);
  });
});
