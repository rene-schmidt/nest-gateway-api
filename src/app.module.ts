import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from './gateway/gateway.module';
import { ProxyModule } from './proxy/proxy.module';
import { SecurityModule } from './security/security.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProxyModule,
    SecurityModule,
    ObservabilityModule,
    GatewayModule,
  ],
})
export class AppModule {}
