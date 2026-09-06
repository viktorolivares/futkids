import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // CORS Configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-academy-id'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Plataforma de Gestión de Academias Deportivas API')
    .setDescription(
      'Documentación de la API Modular Monolith Multi-Tenant para academias deportivas en Perú.\n' +
      'Soporta autenticación JWT, multi-tenancy estricto basado en membresías, sesiones, cobranzas, pagos y facturación SUNAT.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa tu JWT Access Token',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-academy-id',
        description: 'ID de la academia activa (Tenant Context validado contra membresías)',
      },
      'x-academy-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Academy API running on http://0.0.0.0:${port}/api/v1`);
  logger.log(`📖 Swagger documentation available at http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
