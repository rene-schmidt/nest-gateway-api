import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly keys: Set<string>;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('API_KEYS', '');
    const parsed = raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    this.keys = new Set(parsed);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.header('x-api-key')?.trim();

    if (!apiKey || !this.keys.has(apiKey)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    (req as any).apiKey = apiKey;
    return true;
  }
}
