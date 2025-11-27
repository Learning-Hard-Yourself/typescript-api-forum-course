/**
 * HTTP Status Codes as an enum.
 * 
 * TypeScript Concept: enum
 * - Enums provide a way to define a set of named constants
 * - Numeric enums are auto-incremented, but we use explicit values
 * - Can be used in switch statements with exhaustiveness checking
 */
export enum HttpStatus {
    // 2xx Success
    OK = 200,
    Created = 201,
    Accepted = 202,
    NoContent = 204,

    // 3xx Redirection
    MovedPermanently = 301,
    Found = 302,
    NotModified = 304,

    // 4xx Client Errors
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    Conflict = 409,
    UnprocessableEntity = 422,
    TooManyRequests = 429,

    // 5xx Server Errors
    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
}

/**
 * TypeScript Concept: const enum
 * - const enums are completely removed during compilation
 * - Values are inlined at usage sites for better performance
 * - Cannot be used with computed members or reverse mapping
 */
export const enum ModerationActionType {
    EditPost = 'EDIT_POST',
    DeletePost = 'DELETE_POST',
    RestorePost = 'RESTORE_POST',
    LockThread = 'LOCK_THREAD',
    UnlockThread = 'UNLOCK_THREAD',
    PinThread = 'PIN_THREAD',
    UnpinThread = 'UNPIN_THREAD',
    WarnUser = 'WARN_USER',
    BanUser = 'BAN_USER',
}

/**
 * Helper to get status text from HttpStatus enum
 */
export function getStatusText(status: HttpStatus): string {
    switch (status) {
        case HttpStatus.OK:
            return 'OK'
        case HttpStatus.Created:
            return 'Created'
        case HttpStatus.NoContent:
            return 'No Content'
        case HttpStatus.BadRequest:
            return 'Bad Request'
        case HttpStatus.Unauthorized:
            return 'Unauthorized'
        case HttpStatus.Forbidden:
            return 'Forbidden'
        case HttpStatus.NotFound:
            return 'Not Found'
        case HttpStatus.Conflict:
            return 'Conflict'
        case HttpStatus.UnprocessableEntity:
            return 'Unprocessable Entity'
        case HttpStatus.TooManyRequests:
            return 'Too Many Requests'
        case HttpStatus.InternalServerError:
            return 'Internal Server Error'
        default:
            return 'Unknown Status'
    }
}

/**
 * Check if status is a success code (2xx)
 */
export function isSuccessStatus(status: HttpStatus): boolean {
    return status >= 200 && status < 300
}

/**
 * Check if status is a client error (4xx)
 */
export function isClientError(status: HttpStatus): boolean {
    return status >= 400 && status < 500
}

/**
 * Check if status is a server error (5xx)
 */
export function isServerError(status: HttpStatus): boolean {
    return status >= 500 && status < 600
}
