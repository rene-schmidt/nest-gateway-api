import {
  Controller,
  All,
  Req,
  Res,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

type Route = {
  publicPrefix: string;   // what clients call
  envKey: 'AUTH_URL' | 'TASKS_URL' | 'REALTIME_URL';
  stripPrefix: string;    // what to remove before forwarding
};

@Controller()
export class GatewayController {
  private readonly routes: Route[] = [
    { publicPrefix: '/auth', envKey: 'AUTH_URL', stripPrefix: '' },          
    { publicPrefix: '/tasks', envKey: 'TASKS_URL', stripPrefix: '/tasks' },  
    { publicPrefix: '/realtime', envKey: 'REALTIME_URL', stripPrefix: '/realtime' }, 
  ];

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  @All('*')
  async handleAll(@Req() req: Request, @Res() res: Response) {
    const path = req.path ?? '';
    const route = this.routes.find((r) => path.startsWith(r.publicPrefix));

    if (!route) throw new NotFoundException('Route not found');

    const baseUrl = this.config.get<string>(route.envKey);
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        `Gateway misconfigured: missing ${route.envKey}`,
      );
    }

    return this.proxy.forward(req, res, baseUrl, route.stripPrefix);
  }
}
