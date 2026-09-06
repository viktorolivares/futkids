import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const academyId = request.headers['x-academy-id'] || 'GLOBAL';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`[${method}] ${url} [Tenant: ${academyId}] +${duration}ms`);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.warn(`[${method}] ${url} [Tenant: ${academyId}] FAILED +${duration}ms - ${err.message}`);
        },
      }),
    );
  }
}
