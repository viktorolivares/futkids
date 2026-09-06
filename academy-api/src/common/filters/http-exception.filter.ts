import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Ha ocurrido un error interno en el servidor';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = exception.name.replace('Exception', '').toUpperCase();
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;
        code = (resObj.code as string) || (resObj.error as string) || 'HTTP_ERROR';
        details = resObj.message instanceof Array ? resObj.message : resObj.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      // In production do not leak internal stack traces
      message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : exception.message;
    }

    const errorResponse = {
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
