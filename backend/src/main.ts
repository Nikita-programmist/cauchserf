import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const frontendUrlLocal = configService.get<string>('FRONTEND_URL_LOCAL');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: [frontendUrlLocal, frontendUrl].filter(Boolean),
    credentials: true,
  });

  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(configService.get('PORT')) || 8000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
