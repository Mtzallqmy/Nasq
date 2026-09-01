import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { rateLimitMiddleware } from './common/rate-limit.middleware';
import { requestIdMiddleware } from './common/request-id.middleware';
import { getRuntimeConfig } from './config/env';
import { PrismaModule } from './database/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: (config) => {
        Object.assign(process.env, config);
        getRuntimeConfig();
        return config;
      },
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware, rateLimitMiddleware).forRoutes('*');
  }
}
