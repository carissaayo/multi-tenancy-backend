import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
     SwaggerModule.setup('api/docs', app, document);
  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
