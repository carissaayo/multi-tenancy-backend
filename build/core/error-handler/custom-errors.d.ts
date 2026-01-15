export declare class ThrowException extends Error {
    statusCode: number;
    status: string;
    data?: any;
    isOperational: boolean;
    errorCode?: string;
    constructor(message: string, statusCode: number, data?: any, errorCode?: string);
}
export declare enum ErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
    NOT_ACCEPTABLE = "NOT_ACCEPTABLE",
    REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
    CONFLICT = "CONFLICT",
    GONE = "GONE",
    HTTP_VERSION_NOT_SUPPORTED = "HTTP_VERSION_NOT_SUPPORTED",
    PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
    UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    BAD_GATEWAY = "BAD_GATEWAY",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT",
    PRECONDITION_FAILED = "PRECONDITION_FAILED"
}
export declare class customError {
    static badRequest(message?: string, data?: any): ThrowException;
    static unauthorized(message?: string, data?: any): ThrowException;
    static forbidden(message?: string, data?: any): ThrowException;
    static notFound(message?: string, data?: any): ThrowException;
    static methodNotAllowed(message?: string, data?: any): ThrowException;
    static notAcceptable(message?: string, data?: any): ThrowException;
    static requestTimeout(message?: string, data?: any): ThrowException;
    static conflict(message?: string, data?: any): ThrowException;
    static gone(message?: string, data?: any): ThrowException;
    static httpVersionNotSupported(message?: string, data?: any): ThrowException;
    static payloadTooLarge(message?: string, data?: any): ThrowException;
    static unsupportedMediaType(message?: string, data?: any): ThrowException;
    static unprocessableEntity(message?: string, data?: any): ThrowException;
    static internalServerError(message?: string, data?: any): ThrowException;
    static notImplemented(message?: string, data?: any): ThrowException;
    static badGateway(message?: string, data?: any): ThrowException;
    static serviceUnavailable(message?: string, data?: any): ThrowException;
    static gatewayTimeout(message?: string, data?: any): ThrowException;
    static preconditionFailed(message?: string, data?: any): ThrowException;
    static custom(message: string, statusCode: number, data?: any, errorCode?: string): ThrowException;
}
