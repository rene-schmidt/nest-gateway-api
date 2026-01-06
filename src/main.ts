/**
 * Application entry point for bootstrapping the NestJS server.
 * 
 * This file initializes the NestJS application, configures a WebSocket-capable
 * reverse proxy for realtime communication, and starts the HTTP server.
 */

import { NestFactory } from '@nestjs/core'; // Factory used to create NestJS application instances
import { AppModule } from './app.module'; // Root application module
import { createProxyMiddleware } from 'http-proxy-middleware'; // Middleware for HTTP and WebSocket proxying

/**
 * Bootstraps and starts the NestJS application.
 */
async function bootstrap() {
  // Create the NestJS application using the root module
  const app = await NestFactory.create(AppModule);

  // Resolve the realtime service target URL from environment variables or fallback to localhost
  const realtimeTarget = process.env.REALTIME_URL || 'http://localhost:3003';

  /**
   * Proxy middleware for forwarding HTTP and WebSocket traffic
   * from /realtime/socket.io to the realtime backend service.
   */
  const wsProxy = createProxyMiddleware({
    target: realtimeTarget, // Target realtime backend
    changeOrigin: true, // Modify the origin header to match the target
    ws: true, // Enable WebSocket proxying
    pathRewrite: {
      '^/realtime/socket.io': '/socket.io', // Rewrite incoming path for the target service
    },
  });

  // Retrieve the underlying HTTP adapter instance (Express by default)
  const instance = app.getHttpAdapter().getInstance();

  // Register the proxy middleware on the specified route
  instance.use('/realtime/socket.io', wsProxy);

  // Resolve the application port from environment variables or fallback to 3000
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Start the HTTP server
  const server: any = await app.listen(port);

  // Forward HTTP upgrade requests (WebSocket handshake) to the proxy
  server.on('upgrade', wsProxy.upgrade);
}

// Execute the bootstrap function to start the application
bootstrap();
