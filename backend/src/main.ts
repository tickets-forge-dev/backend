import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpLoggingInterceptor } from './shared/infrastructure/interceptors/http-logging.interceptor';
import session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global HTTP logging interceptor
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // Session configuration (required for OAuth flow)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: true, // Changed to true to ensure session is created
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 15, // 15 minutes
        sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
        domain: undefined,
      },
      name: 'forge.sid', // Custom session name
    }),
  );

  // CORS - Allow multiple origins for different environments
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    // Production domains
    'https://forge-ai.dev',
    'https://www.forge-ai.dev',
    'https://forge.dev.ai',
    'https://www.forge.dev.ai',
  ].filter(Boolean);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked request from: ${requestOrigin}`);
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe (Zod validation at controller layer)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // OpenAPI/Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Executable Tickets API')
    .setDescription('Transform product intent into execution-ready tickets')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`📊 HTTP Logging: Enabled`);
}

bootstrap();
