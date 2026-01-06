import { Provider } from '@nestjs/common'; // NestJS type for defining custom providers
import { ConfigService } from '@nestjs/config'; // Service for accessing environment-based configuration
import Redis from 'ioredis'; // Redis client implementation

/**
 * Injection token used to uniquely identify the Redis client
 * within NestJS's dependency injection system.
 */
export const REDIS = Symbol('REDIS');

/**
 * NestJS provider responsible for creating and supplying
 * a configured Redis client instance.
 */
export const redisProvider: Provider = {
  // Token under which the Redis client will be registered
  provide: REDIS,

  // Inject ConfigService to access environment variables
  inject: [ConfigService],

  /**
   * Factory function that creates a Redis client instance.
   *
   * @param config - ConfigService instance for reading configuration values
   * @returns A configured ioredis Redis client
   */
  useFactory: (config: ConfigService) => {
    // Resolve Redis host from configuration or fallback to localhost
    const host = config.get<string>('REDIS_HOST', 'localhost');

    // Resolve Redis port from configuration or fallback to 6379
    const port = Number(config.get<string>('REDIS_PORT', '6379'));

    // Create and return a new Redis client instance
    return new Redis({ host, port });
  },
};
