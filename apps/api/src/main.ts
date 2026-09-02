import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { getRuntimeConfig } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = getRuntimeConfig();

  // Foundation deliberately does not trust X-Forwarded-* yet. Until the production
  // reverse-proxy topology is pinned, req.ip represents the immediate network peer.
  app.set('trust proxy', false);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const openApiConfig = new DocumentBuilder()
    .setTitle('نَسَق API')
    .setDescription('NASQ foundation REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-workspace-id' }, 'workspace')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/openapi.json',
  });

  await app.listen(config.apiPort, '0.0.0.0');
  console.info(
    JSON.stringify({
      level: 'info',
      event: 'api_started',
      port: config.apiPort,
      timezoneStorage: 'UTC',
      defaultDisplayTimezone: 'Asia/Riyadh',
    }),
  );
}

void bootstrap();
