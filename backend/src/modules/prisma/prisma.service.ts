import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      if (process.env.CODSHIELD_DEMO_MODE === 'true') {
        console.warn('Prisma connection failed, running in demo data mode:', error);
      } else {
        console.error('Database connection failed in production mode. System halting.', error);
        throw error;
      }
    }
  }
}
