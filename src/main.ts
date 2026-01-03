import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const realtimeTarget = process.env.REALTIME_URL || 'http://localhost:3003';

  const wsProxy = createProxyMiddleware({
    target: realtimeTarget,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/realtime/socket.io': '/socket.io',
    },
  });

  const instance = app.getHttpAdapter().getInstance();

  instance.use('/realtime/socket.io', wsProxy);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server: any = await app.listen(port);

  server.on('upgrade', wsProxy.upgrade);
}
bootstrap();
