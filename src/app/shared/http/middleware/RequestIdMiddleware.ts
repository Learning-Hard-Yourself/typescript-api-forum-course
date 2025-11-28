import type { NextFunction, Request, Response } from 'express'
import { v7 as uuidv7 } from 'uuid'

/**
 * Middleware that generates a unique request ID for each request.
 * 
 * The request ID is:
 * - Added to req.requestId for use in logging and tracing
 * - Added to response headers as X-Request-Id
 * - Used for correlating logs across services
 * 
 * If the client sends an X-Request-Id header, it will be used instead.
 */
export function requestIdMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Use client-provided ID or generate a new one
        const requestId = (req.get('X-Request-Id') as string) ?? uuidv7()

        // Attach to request for logging
        req.requestId = requestId

        // Include in response headers
        res.set('X-Request-Id', requestId)

        next()
    }
}
