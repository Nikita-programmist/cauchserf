import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = new Set(
    [process.env.FRONTEND_URL, process.env.FRONTEND_URL_LOCAL, 'http://localhost:3000'].filter(
      Boolean
    ) as string[]
  );

  const isAllowedVercelOrigin = (origin: string) =>
    /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/i.test(origin);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin) || isAllowedVercelOrigin(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 8000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Server is running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();
