import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { RouterModule } from 'nest-router';
import { routes } from './routes';
import { ConfigModule } from './shared/config/config.module';
import { LoggerModule } from './shared/logger/logger.module';
import { InfoModule } from './info/info.module';
import { HttpsRedirectMiddleware } from './common/middlewares/https-redirection/https-redirection.middleware';
import { AuthModule } from './auth/auth.module';
import { EncryptModule } from './encrypt/encrypt.module';
import { AccessModule } from './access/access.module';

@Module({
  imports: [
    RouterModule.forRoutes(routes),
    LoggerModule,
    ConfigModule,
    InfoModule,
    EncryptModule,
    AccessModule,
    AuthModule,
  ],
})
export class ApplicationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpsRedirectMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
