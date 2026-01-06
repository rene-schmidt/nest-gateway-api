import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common'; // NestJS interfaces and decorators for guards and dependency injection
import { TooManyRequestsException } from './too-many-requests.exception'; // Custom exception for rate limiting
import { ConfigService } from '@nestjs/config'; // Service for accessing configuration values
import { Request } from 'express'; // Express request type
import Redis from 'ioredis'; // Redis client
import { REDIS } from './redis.provider'; // Redis injection token

/**
 * Guard that enforces rate limiting based on API key or client IP address.
 *
 * This guard uses Redis to count requests within a fixed time window
 * and throws a 429 Too Many Requests exception when the limit is exceeded.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  // Maximum number of allowed requests per window
  private readonly points: number;

  // Length of the rate limit window in seconds
  private readonly windowSec: number;

  /**
   * Creates a new RateLimitGuard instance.
   *
   * @param config - ConfigService used to read rate limit configuration
   * @param redis - Redis client used for tracking request counts
   */
  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {
    // Resolve the maximum allowed requests from configuration
    this.points = Number(this.config.get<string>('RATE_LIMIT_POINTS', '30'));

    // Resolve the rate limit window size from configuration
    this.windowSec = Number(this.config.get<string>('RATE_LIMIT_WINDOW_SEC', '60'));
  }

  /**
   * Determines whether the current request is allowed to proceed.
   *
   * @param context - Execution context containing request details
   * @returns True if the request is within the rate limit
   * @throws TooManyRequestsException when the rate limit is exceeded
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract the Express request object
    const req = context.switchToHttp().getRequest<Request>();

    // Read API key from request (if present)
    const apiKey = (req as any).apiKey as string | undefined;

    // Determine client IP address, considering reverse proxies
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Use API key if available, otherwise fall back to IP address
    const identity = apiKey || ip;

    // Get current Unix timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    // Calculate the start of the current rate limit window
    const windowStart = now - (now % this.windowSec);

    // Build a Redis key unique to the identity and time window
    const key = `rl:${identity}:${windowStart}`;

    // Increment the request counter for this key
    const count = await this.redis.incr(key);

    // Set key expiration on first increment to match the window duration
    if (count === 1) {
      await this.redis.expire(key, this.windowSec);
    }

    // Reject the request if the allowed number of points is exceeded
    if (count > this.points) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    // Allow the request to proceed
    return true;
  }
}
