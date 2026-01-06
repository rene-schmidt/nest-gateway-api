import { Injectable, BadGatewayException } from '@nestjs/common'; // NestJS DI decorator and HTTP 502 exception
import { HttpService } from '@nestjs/axios'; // NestJS HTTP client wrapper around Axios
import { Request, Response } from 'express'; // Express request/response types

/**
 * Hop-by-hop headers that must not be forwarded by proxies.
 *
 * These headers are specific to a single transport-level connection and are
 * defined in HTTP specifications as non-forwardable by intermediaries.
 */
const HOP_BY_HOP = new Set([
  'connection', // Connection-specific header
  'keep-alive', // Connection keep-alive parameters
  'proxy-authenticate', // Proxy authentication challenge
  'proxy-authorization', // Proxy authentication credentials
  'te', // Transfer encodings (not end-to-end)
  'trailer', // Trailer headers in chunked encoding
  'transfer-encoding', // Hop-by-hop transfer encoding
  'upgrade', // Protocol upgrade header (e.g., WebSocket)
  'host', // Host header should be set by the client/proxy logic
  'content-length', // Content length is connection/message framing specific
]);

/**
 * Service responsible for forwarding incoming HTTP requests to an upstream service.
 *
 * It builds an upstream URL from the incoming request, sanitizes hop-by-hop headers,
 * forwards the request via Axios, mirrors upstream response headers (excluding hop-by-hop),
 * and returns the upstream response status and body to the client.
 */
@Injectable()
export class ProxyService {
  /**
   * Creates a new ProxyService instance.
   *
   * @param http - HttpService used to perform upstream HTTP requests
   */
  constructor(private readonly http: HttpService) {}

  /**
   * Forwards an incoming request to an upstream target and streams the response back.
   *
   * @param req - Incoming Express request
   * @param res - Express response used to return the upstream result
   * @param targetBaseUrl - Base URL of the upstream service (scheme + host + optional port)
   * @param stripPrefix - Prefix to remove from the incoming URL before forwarding
   * @throws BadGatewayException when the upstream request fails to execute
   */
  async forward(req: Request, res: Response, targetBaseUrl: string, stripPrefix: string) {
    // Derive the upstream path by removing the route prefix, defaulting to '/'
    const upstreamPath = req.originalUrl.replace(stripPrefix, '') || '/';

    // Compose the full upstream URL
    const url = `${targetBaseUrl}${upstreamPath}`;

    // Clone incoming request headers to forward them upstream
    const headers: Record<string, any> = { ...req.headers };

    // Remove hop-by-hop headers that must not be forwarded
    for (const h of Object.keys(headers)) {
      if (HOP_BY_HOP.has(h.toLowerCase())) delete headers[h];
    }

    // Preserve an existing request id for tracing across services
    const requestId = (req as any).requestId || req.header('x-request-id');

    // Forward the request id header if available
    if (requestId) headers['x-request-id'] = requestId;

    try {
      // Perform the upstream request with Axios and always resolve (no status-based throw)
      const resp = await this.http.axiosRef.request({
        url, // Upstream URL
        method: req.method as any, // HTTP method from the incoming request
        headers, // Sanitized headers forwarded upstream
        data: req.body, // Forward request body as-is
        responseType: 'arraybuffer', // Treat response as raw bytes to support non-JSON payloads
        validateStatus: () => true, // Accept all status codes without throwing
      });

      // Mirror upstream response headers back to the client (excluding hop-by-hop)
      for (const [k, v] of Object.entries(resp.headers || {})) {
        if (!HOP_BY_HOP.has(k.toLowerCase())) {
          res.setHeader(k, v as any);
        }
      }

      // Return upstream status code and body to the client
      res.status(resp.status).send(resp.data);
    } catch (e) {
      // Convert upstream connectivity/errors into a 502 Bad Gateway
      throw new BadGatewayException('Upstream service not reachable');
    }
  }
}
