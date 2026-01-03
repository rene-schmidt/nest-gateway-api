import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
