import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  console.log(`NestJS application successfully running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/swagger`);
}

bootstrap();
