import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { PrismaService } from './modules/prisma/prisma.service';

dotenv.config();

// Structured logging utility
function log(level: 'INFO' | 'ERROR' | 'WARN', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...meta };
  console.log(JSON.stringify(logEntry));
}

async function bootstrap() {
  const startTime = Date.now();
  log('INFO', 'Starting CODShield Backend...', { 
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001 
  });

  // Validate required environment variables
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    log('ERROR', 'Missing required environment variables', { missingVars });
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable trust proxy for correct client IP detection behind Next.js/Render proxies
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Get Prisma service for health checks
  const prismaService = app.get(PrismaService);

  // Comprehensive health check endpoint with database status
  app.getHttpAdapter().get('/health', async (_req: any, res: any) => {
    try {
      const dbConnected = await prismaService.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      
      res.json({
        status: dbConnected ? 'ok' : 'degraded',
        service: 'CODShield API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        uptime,
        environment: process.env.NODE_ENV || 'development',
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'CODShield API',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: 'Health check failed',
      });
    }
  });

  // Legacy root endpoint for backward compatibility
  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'CODShield API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      healthCheck: '/health',
    });
  });

  // Secure CORS configuration - only allow specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  log('INFO', 'Configured CORS', { allowedOrigins });

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true); // allow server-to-server / curl
      const allowed = allowedOrigins.includes(origin);
      if (!allowed) {
        log('WARN', 'CORS blocked request', { origin, allowedOrigins });
      }
      callback(allowed ? null : new Error('CORS: origin not allowed'), allowed);
    },
    credentials: true,
  });

  // Enable Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('CODShield API')
    .setDescription('COD Trust Infrastructure backend services for risk calculation and RTO protection')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // Validate database connection before starting
  try {
    log('INFO', 'Validating database connection...');
    await prismaService.$queryRaw`SELECT 1`;
    log('INFO', 'Database connection validated successfully');
  } catch (error) {
    log('ERROR', 'Database connection failed', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Database connection failed. Please check DATABASE_URL and network connectivity.');
  }

  const port = process.env.PORT || 5001;
  
  // Bind to 0.0.0.0 to accept connections from any interface (required for Render)
  await app.listen(port, '0.0.0.0');
  
  const startupTime = Date.now() - startTime;
  log('INFO', 'CODShield Backend started successfully', { 
    port, 
    host: '0.0.0.0',
    startupTimeMs: startupTime,
    swagger: `http://localhost:${port}/swagger`,
    health: `http://localhost:${port}/health`
  });
}

bootstrap().catch((error) => {
  log('ERROR', 'Failed to start backend', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
