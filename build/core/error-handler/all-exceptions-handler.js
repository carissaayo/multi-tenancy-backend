"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const custom_errors_1 = require("./custom-errors");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    allowedOrigins = (() => {
        const origins = [];
        origins.push('http://localhost:3000');
        if (process.env.FRONTEND_URL) {
            const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
            if (frontendUrl)
                origins.push(frontendUrl);
        }
        if (process.env.ALLOWED_ORIGINS) {
            const additionalOrigins = process.env.ALLOWED_ORIGINS
                .split(',')
                .map(origin => origin.trim().replace(/\/$/, ''))
                .filter(origin => origin.length > 0);
            origins.push(...additionalOrigins);
        }
        return [...new Set(origins)];
    })();
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let data = null;
        let details = null;
        if (exception instanceof custom_errors_1.ThrowException) {
            status = exception.statusCode;
            message = exception.message;
            errorCode = exception.errorCode ?? errorCode;
            data = exception.data ?? null;
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            }
            else if (res && typeof res === 'object') {
                message = res.message || exception.message;
                if (Array.isArray(res.message)) {
                    message = res.message.join(', ');
                    details = res.message;
                }
                errorCode = res.errorCode || this.getErrorCodeFromStatus(status);
            }
            else {
                message = exception.message;
            }
        }
        else if (this.isTypeOrmError(exception)) {
            const typeOrmError = exception;
            message = this.extractTypeOrmErrorMessage(typeOrmError);
            errorCode = 'DATABASE_ERROR';
            status = common_1.HttpStatus.BAD_REQUEST;
            details = this.extractTypeOrmErrorDetails(typeOrmError);
        }
        else if (exception instanceof Error) {
            message = exception.message || 'An unexpected error occurred';
            errorCode = 'UNHANDLED_ERROR';
            if (process.env.NODE_ENV === 'development') {
                details = {
                    name: exception.name,
                    stack: exception.stack,
                };
            }
        }
        else {
            message = 'An unexpected error occurred';
            errorCode = 'UNKNOWN_ERROR';
            if (process.env.NODE_ENV === 'development') {
                details = {
                    type: typeof exception,
                    value: String(exception),
                };
            }
        }
        this.logger.error(`[${request.method}] ${request.url} → ${message}`, exception instanceof Error ? exception.stack : JSON.stringify(exception));
        const errorResponse = {
            status: status >= 500 ? 'error' : 'failed',
            statusCode: status,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (data !== null) {
            errorResponse.data = data;
        }
        if (process.env.NODE_ENV === 'development' && details) {
            errorResponse.details = details;
        }
        const origin = request.headers.origin;
        if (origin && this.allowedOrigins.includes(origin)) {
            response.setHeader('Access-Control-Allow-Origin', origin);
            response.setHeader('Access-Control-Allow-Credentials', 'true');
            response.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token, Authorization');
        }
        response.status(status).json(errorResponse);
    }
    isTypeOrmError(exception) {
        return (exception?.code ||
            exception?.sqlMessage ||
            exception?.sqlState ||
            exception?.query ||
            exception?.driverError);
    }
    extractTypeOrmErrorMessage(error) {
        if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
            const match = error.detail || error.message;
            if (match) {
                const fieldMatch = match.match(/Key \(([^)]+)\)/);
                if (fieldMatch) {
                    return `${fieldMatch[1]} already exists`;
                }
            }
            return 'Duplicate entry. This record already exists';
        }
        if (error.code === '23503' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            return 'Referenced record does not exist';
        }
        if (error.code === '23502' || error.code === 'ER_BAD_NULL_ERROR') {
            const match = error.message?.match(/column "([^"]+)"/);
            if (match) {
                return `${match[1]} is required`;
            }
            return 'Required field is missing';
        }
        if (error.code === '23514') {
            return 'Data validation failed';
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return 'Database connection failed';
        }
        return error.message || 'Database error occurred';
    }
    extractTypeOrmErrorDetails(error) {
        const details = {
            code: error.code,
            sqlState: error.sqlState,
        };
        if (error.query) {
            details.query = error.query;
        }
        if (error.parameters) {
            details.parameters = error.parameters;
        }
        if (error.driverError) {
            details.driverError = error.driverError;
        }
        return details;
    }
    getErrorCodeFromStatus(status) {
        const statusToCode = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            405: 'METHOD_NOT_ALLOWED',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            500: 'INTERNAL_SERVER_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
        };
        return statusToCode[status] || 'INTERNAL_SERVER_ERROR';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions-handler.js.map