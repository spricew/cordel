import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas cuelgan de /api/v1 (ej. /api/v1/health).
  app.setGlobalPrefix('api/v1');

  // Valida automáticamente los DTOs que entren: quita campos de más,
  // rechaza los desconocidos y convierte tipos (ej. "3" a 3).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Errores con forma pareja en toda la API.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Al recibir SIGTERM/SIGINT avisa a Nest para que corra onModuleDestroy
  // (aquí se cierran Prisma y el pool, sin conexiones colgadas).
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
}

await bootstrap();
