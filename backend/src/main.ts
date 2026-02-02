import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Session configuration (required for OAuth flow)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: true, // Changed to true to ensure session is created
      cookie: {
        httpOnly: true,
        secure: false, // Must be false for localhost
        maxAge: 1000 * 60 * 15, // 15 minutes
        sameSite: 'lax',
        domain: undefined, // Don't set domain for localhost
      },
      name: 'forge.sid', // Custom session name
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
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

  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
