
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


export function isSuccessStatus(status: HttpStatus): boolean {
    return status >= 200 && status < 300
}


export function isClientError(status: HttpStatus): boolean {
    return status >= 400 && status < 500
}


export function isServerError(status: HttpStatus): boolean {
    return status >= 500 && status < 600
}
