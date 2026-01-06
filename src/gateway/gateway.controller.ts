import {
  Controller,
  All,
  Req,
  Res,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'; // NestJS routing decorators and HTTP exceptions
import { ConfigService } from '@nestjs/config'; // Service for accessing configuration values
import type { Request, Response } from 'express'; // Express request/response types
import { ProxyService } from '../proxy/proxy.service'; // Service that forwards requests upstream

/**
 * Describes a gateway route mapping from a public prefix to an upstream service.
 */
type Route = {
  publicPrefix: string;   // Public URL prefix used by clients
  envKey: 'AUTH_URL' | 'TASKS_URL' | 'REALTIME_URL'; // Configuration key that holds the upstream base URL
  stripPrefix: string;    // Prefix to remove from the request URL before forwarding
};

/**
 * Gateway controller that forwards all incoming requests to downstream services
 * based on the request path prefix.
 *
 * This controller resolves the upstream base URL from configuration and delegates
 * request forwarding to ProxyService.
 */
@Controller()
export class GatewayController {
  // Route table used to match incoming paths to upstream services
  private readonly routes: Route[] = [
    { publicPrefix: '/auth', envKey: 'AUTH_URL', stripPrefix: '' },          // Auth service is mounted at root upstream
    { publicPrefix: '/tasks', envKey: 'TASKS_URL', stripPrefix: '/tasks' },  // Remove /tasks before forwarding
    { publicPrefix: '/realtime', envKey: 'REALTIME_URL', stripPrefix: '/realtime' }, // Remove /realtime before forwarding
  ];

  /**
   * Creates a new GatewayController instance.
   *
   * @param proxy - ProxyService used to forward requests to upstream services
   * @param config - ConfigService used to resolve upstream base URLs
   */
  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Catch-all handler that matches the request path to a configured route and forwards it.
   *
   * @param req - Incoming Express request
   * @param res - Express response used to return the upstream result
   * @throws NotFoundException when no route matches the request path
   * @throws ServiceUnavailableException when the upstream URL is missing in configuration
   */
  @All('*')
  async handleAll(@Req() req: Request, @Res() res: Response) {
    // Read the request path for route matching
    const path = req.path ?? '';

    // Find the first configured route whose public prefix matches the request path
    const route = this.routes.find((r) => path.startsWith(r.publicPrefix));

    // Reject requests that do not match any known route
    if (!route) throw new NotFoundException('Route not found');

    // Resolve the upstream service base URL from configuration
    const baseUrl = this.config.get<string>(route.envKey);

    // Fail fast if the gateway is missing required configuration
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        `Gateway misconfigured: missing ${route.envKey}`,
      );
    }

    // Forward the request to the selected upstream service
    return this.proxy.forward(req, res, baseUrl, route.stripPrefix);
  }
}
