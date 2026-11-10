import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap(): Promise<void> {
  // El body parser por defecto límita el JSON a 100 KB: los adjuntos
  // llegan en base64 dentro del body (un archivo de 5 MB pesa ~7 MB en
  // base64), así que lo apagamos y registramos los parsers a mano.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Mismo límite para los dos parsers de formularios/JSON de Express.
  app.use(json({ limit: '8mb' }));
  app.use(urlencoded({ extended: true, limit: '8mb' }));

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
