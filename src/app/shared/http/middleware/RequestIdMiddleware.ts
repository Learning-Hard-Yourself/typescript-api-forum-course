import type { NextFunction, Request, Response } from 'express'
import { v7 as uuidv7 } from 'uuid'


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
