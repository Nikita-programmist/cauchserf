import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      const fallbackDbUrl =
        process.env.SUPABASE_DB_URL ||
        process.env.SUPABASE_DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;

      if (fallbackDbUrl) {
        process.env.DATABASE_URL = fallbackDbUrl;
        this.logger.warn('DATABASE_URL is not set. Falling back to alternative database connection variable.');
      } else {
        this.logger.error(
          'DATABASE_URL is not set. Please configure DATABASE_URL or SUPABASE_DB_URL/POSTGRES_URL in the environment.'
        );
        throw new Error('Database connection URL is missing.');
      }
    }

    const maxAttempts = 5;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to the database successfully.');
        return;
      } catch (error) {
        this.logger.error(`Database connection attempt ${attempt} failed.`, error instanceof Error ? error.stack : String(error));
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.warn('Unable to establish database connection after multiple attempts. The application will continue to run and retry on demand.');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.error('Error while disconnecting from the database.', error instanceof Error ? error.stack : String(error));
    }
  }
}
