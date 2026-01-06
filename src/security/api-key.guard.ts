import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'; // NestJS guard interfaces, decorators, and exceptions
import { ConfigService } from '@nestjs/config'; // Service for accessing configuration values
import { Request } from 'express'; // Express request type

/**
 * Guard that validates incoming requests using an API key.
 *
 * The API key is expected in the `x-api-key` HTTP header and is validated
 * against a configured allowlist.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // Set of allowed API keys loaded from configuration
  private readonly keys: Set<string>;

  /**
   * Creates a new ApiKeyGuard instance.
   *
   * @param config - ConfigService used to read API key configuration
   */
  constructor(private readonly config: ConfigService) {
    // Read the raw comma-separated API keys from configuration
    const raw = this.config.get<string>('API_KEYS', '');

    // Parse, trim, and filter the API keys
    const parsed = raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    // Store the API keys in a Set for efficient lookup
    this.keys = new Set(parsed);
  }

  /**
   * Determines whether the current request is authorized.
   *
   * @param context - Execution context containing request details
   * @returns True if the API key is valid
   * @throws UnauthorizedException when the API key is missing or invalid
   */
  canActivate(context: ExecutionContext): boolean {
    // Extract the Express request object
    const req = context.switchToHttp().getRequest<Request>();

    // Read the API key from the request header
    const apiKey = req.header('x-api-key')?.trim();

    // Reject the request if the API key is missing or not allowed
    if (!apiKey || !this.keys.has(apiKey)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    // Attach the validated API key to the request for downstream usage
    (req as any).apiKey = apiKey;

    // Allow the request to proceed
    return true;
  }
}
