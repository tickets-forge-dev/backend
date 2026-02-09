import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpLoggingInterceptor } from './shared/infrastructure/interceptors/http-logging.interceptor';
import session = require('express-session');

async function bootstrap() {
  // Validate critical environment variables before app startup
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredEnvVars = ['SESSION_SECRET', 'FRONTEND_URL'];

  if (isProduction) {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(
        `❌ Production Error: Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Required vars: SESSION_SECRET, FRONTEND_URL'
      );
    }
  }

  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global HTTP logging interceptor
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // Session configuration (required for OAuth flow)
  // Use production secret if set, otherwise use development default
  const sessionSecret = process.env.SESSION_SECRET || (isProduction ? undefined : 'dev-secret-for-local-testing');

  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }

  app.use(
    session({
      secret: sessionSecret!,
      resave: false,
      saveUninitialized: true, // Changed to true to ensure session is created
      cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1000 * 60 * 15, // 15 minutes
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
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

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
