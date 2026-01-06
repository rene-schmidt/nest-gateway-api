import { Injectable, NestMiddleware } from '@nestjs/common'; // NestJS DI decorator and middleware interface
import { Request, Response, NextFunction } from 'express'; // Express request/response/next types
import { randomUUID } from 'crypto'; // Node.js utility for generating UUIDs

/**
 * Middleware that ensures every incoming request has a unique request ID.
 *
 * If the client provides an `x-request-id` header, it is reused.
 * Otherwise, a new UUID is generated and attached to both the request
 * and the response for end-to-end request tracing.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  /**
   * Middleware execution method.
   *
   * @param req - Incoming Express request
   * @param res - Express response
   * @param next - Callback to pass control to the next middleware
   */
  use(req: Request, res: Response, next: NextFunction) {
    // Read an existing request ID from the incoming headers
    const existing = req.header('x-request-id');

    // Use the existing request ID if valid, otherwise generate a new UUID
    const requestId = existing && existing.trim().length > 0 ? existing : randomUUID();

    // Attach the request ID to the request object for downstream access
    (req as any).requestId = requestId;

    // Expose the request ID in the response headers
    res.setHeader('x-request-id', requestId);

    // Continue to the next middleware in the chain
    next();
  }
}
