import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import { TooManyRequestsException } from './too-many-requests.exception';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Redis from 'ioredis';
import { REDIS } from './redis.provider';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly points: number;
  private readonly windowSec: number;

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {
    this.points = Number(this.config.get<string>('RATE_LIMIT_POINTS', '30'));
    this.windowSec = Number(this.config.get<string>('RATE_LIMIT_WINDOW_SEC', '60'));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const apiKey = (req as any).apiKey as string | undefined;
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const identity = apiKey || ip;

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.windowSec);
    const key = `rl:${identity}:${windowStart}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.windowSec);
    }

    if (count > this.points) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    return true;
  }
}
