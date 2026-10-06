import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
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

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        response.status(status).json({
            statusCode: status,
            message: extractMessage(exception),
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
