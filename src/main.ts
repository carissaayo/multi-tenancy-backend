import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './core/error-handler/all-exceptions-handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable trust proxy for correct hostname parsing behind load balancers (Render, etc.)
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter instanceof ExpressAdapter) {
    httpAdapter.getInstance().set('trust proxy', true);
  }

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenancy API')
    .setDescription('API documentation for the Multi-Tenancy backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 8000;
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
