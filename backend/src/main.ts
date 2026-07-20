import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable trust proxy for correct client IP detection behind Next.js/Render proxies
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Health check at root — allows Render and uptime monitors to verify the service is alive
  app.getHttpAdapter().get('/', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'CODShield API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Enable CORS — allow localhost (dev) + any *.onrender.com or *.vercel.app domain (prod)
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true); // allow server-to-server / curl
      const allowed =
        allowedOrigins.includes(origin) ||
        /\.onrender\.com$/.test(origin) ||
        /\.vercel\.app$/.test(origin);
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

  const port = process.env.PORT || 5001;
  await app.listen(port);
  console.log(`NestJS application successfully running on port: ${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/swagger`);
}

bootstrap();
