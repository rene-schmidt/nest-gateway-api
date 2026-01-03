import { Injectable, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

@Injectable()
export class ProxyService {
  constructor(private readonly http: HttpService) {}

  async forward(req: Request, res: Response, targetBaseUrl: string, stripPrefix: string) {
    const upstreamPath = req.originalUrl.replace(stripPrefix, '') || '/';
    const url = `${targetBaseUrl}${upstreamPath}`;

    const headers: Record<string, any> = { ...req.headers };
    for (const h of Object.keys(headers)) {
      if (HOP_BY_HOP.has(h.toLowerCase())) delete headers[h];
    }

    const requestId = (req as any).requestId || req.header('x-request-id');
    if (requestId) headers['x-request-id'] = requestId;

    try {
      const resp = await this.http.axiosRef.request({
        url,
        method: req.method as any,
        headers,
        data: req.body,
        responseType: 'arraybuffer',
        validateStatus: () => true, 
      });

      for (const [k, v] of Object.entries(resp.headers || {})) {
        if (!HOP_BY_HOP.has(k.toLowerCase())) {
          res.setHeader(k, v as any);
        }
      }

      res.status(resp.status).send(resp.data);
    } catch (e) {
      throw new BadGatewayException('Upstream service not reachable');
    }
  }
}
