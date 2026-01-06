import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'; // NestJS exception handling interfaces and utilities
import { Request, Response } from 'express'; // Express request/response types

/**
 * Global HTTP exception filter that normalizes error responses.
 *
 * This filter catches all thrown exceptions, maps them to a consistent
 * JSON error structure, assigns standardized error codes, and includes
 * a request ID for traceability.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Handles an exception thrown during request processing.
   *
   * @param exception - The thrown exception (HTTP or unknown)
   * @param host - Arguments host providing access to the execution context
   */
  catch(exception: unknown, host: ArgumentsHost) {
    // Switch to HTTP context to access Express request/response objects
    const ctx = host.switchToHttp();

    // Extract the incoming request
    const req = ctx.getRequest<Request>();

    // Extract the outgoing response
    const res = ctx.getResponse<Response>();

    // Resolve the request ID for error correlation
    const requestId = (req as any).requestId || req.header('x-request-id') || '-';

    // Default to internal server error values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';

    // Handle known HTTP exceptions
    if (exception instanceof HttpException) {
      // Extract HTTP status code
      status = exception.getStatus();

      // Extract exception response payload
      const response = exception.getResponse() as any;

      // Resolve a human-readable error message
      message =
        typeof response === 'string'
          ? response
          : response?.message?.toString?.() || exception.message;

      // Map common HTTP status codes to application-specific error codes
      if (status === 401) code = 'UNAUTHORIZED';
      else if (status === 403) code = 'FORBIDDEN';
      else if (status === 404) code = 'NOT_FOUND';
      else if (status === 429) code = 'RATE_LIMITED';
      else if (status >= 400 && status < 500) code = 'BAD_REQUEST';
    }

    // Send the normalized error response
    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        requestId,
      },
    });
  }
}
