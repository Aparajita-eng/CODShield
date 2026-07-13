import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      process.env.CODSHIELD_DEMO_MODE = 'true';
      console.warn('Prisma connection failed, will use demo data:', error);
    }
  }
}
