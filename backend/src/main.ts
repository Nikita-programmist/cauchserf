import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl ? [frontendUrl] : undefined,
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 8000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Server is running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();
