"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const all_exceptions_handler_1 = require("./core/error-handler/all-exceptions-handler");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter instanceof platform_express_1.ExpressAdapter) {
        httpAdapter.getInstance().set('trust proxy', true);
    }
    app.useGlobalFilters(new all_exceptions_handler_1.AllExceptionsFilter());
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Multi-Tenancy API')
        .setDescription('API documentation for the Multi-Tenancy backend')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    }, 'access-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    if (process.env.NODE_ENV !== 'production') {
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env.PORT || 8000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map