import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const start = Date.now();
    const requestId = (req as any).requestId || req.header('x-request-id') || '-';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          console.log(
            `[${requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          console.log(
            `[${requestId}] ${req.method} ${req.originalUrl} -> ERROR (${ms}ms)`,
          );
        },
      }),
    );
  }
}
