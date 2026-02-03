import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    private readonly allowedOrigins;
    catch(exception: unknown, host: ArgumentsHost): void;
    private isTypeOrmError;
    private extractTypeOrmErrorMessage;
    private extractTypeOrmErrorDetails;
    private getErrorCodeFromStatus;
}
