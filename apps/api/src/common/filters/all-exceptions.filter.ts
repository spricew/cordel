import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}

// Atrapa todo lo que salga de cualquier controlador y lo devuelve con
// forma pareja: { statusCode, message, path, timestamp }. Sin esto, cada
// error sale con forma distinta (o con la pila al aire en desarrollo).
// Se registra global en main.ts (ver Fase C).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    // El body-parser de Express lanza un Error crudo (no HttpException)
    // cuando el body supera el límite del parser (entity.too.large):
    // lo traducimos a 413 con mensaje en español en vez de un 500.
    let status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let tooLarge = false;
    if (
      exception instanceof Error &&
      (exception as { type?: string }).type === 'entity.too.large'
    ) {
      tooLarge = true;
      status = HttpStatus.PAYLOAD_TOO_LARGE;
    }

    response.status(status).json({
      statusCode: status,
      message: tooLarge
        ? 'La petición supera el tamaño máximo permitido'
        : extractMessage(exception),
      path: request.url,
      timestamp: new Date().toISOString(),
    } satisfies ErrorBody);
  }
}

function extractMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message: unknown = body.message;
      return typeof message === 'string' ? message : JSON.stringify(message);
    }
    return exception.message;
  }
  return exception instanceof Error ? 'Internal server error' : 'Unknown error';
}
