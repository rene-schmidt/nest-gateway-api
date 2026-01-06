import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'; // NestJS module and middleware configuration interfaces
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'; // Tokens for global filters and interceptors
import { LoggingInterceptor } from './logging.interceptor'; // Interceptor for request/response logging
import { HttpExceptionFilter } from './http-exception.filter'; // Global HTTP exception filter
import { RequestIdMiddleware } from './request-id.middleware'; // Middleware for attaching request IDs

/**
 * Module responsible for application-wide observability concerns.
 *
 * This includes request/response logging, centralized HTTP exception handling,
 * and request correlation via request IDs.
 */
@Module({
  providers: [
    // Register the logging interceptor globally
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },

    // Register the HTTP exception filter globally
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class ObservabilityModule implements NestModule {
  /**
   * Configures middleware for the module.
   *
   * @param consumer - Middleware consumer used to apply middleware to routes
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply the RequestIdMiddleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
