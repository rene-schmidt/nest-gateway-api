import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'; // NestJS interceptor interfaces and decorators
import { Observable } from 'rxjs'; // Observable type for interceptor handling
import { tap } from 'rxjs/operators'; // RxJS operator for side effects
import { Request, Response } from 'express'; // Express request/response types

/**
 * Interceptor that logs incoming HTTP requests and their outcomes.
 *
 * This interceptor measures request duration, correlates logs using a request ID,
 * and logs both successful responses and errors in a consistent format.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  /**
   * Intercepts the execution of a request and logs timing and result information.
   *
   * @param context - Execution context providing access to request and response
   * @param next - Call handler to continue request processing
   * @returns An observable wrapping the request lifecycle
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Switch to HTTP context to access Express request/response objects
    const http = context.switchToHttp();

    // Extract the incoming request
    const req = http.getRequest<Request>();

    // Extract the outgoing response
    const res = http.getResponse<Response>();

    // Capture the request start timestamp
    const start = Date.now();

    // Resolve the request ID for log correlation
    const requestId = (req as any).requestId || req.header('x-request-id') || '-';

    // Continue request handling and attach logging side effects
    return next.handle().pipe(
      tap({
        // Log successful request completion
        next: () => {
          const ms = Date.now() - start;
          console.log(
            `[${requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`,
          );
        },

        // Log request errors
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
