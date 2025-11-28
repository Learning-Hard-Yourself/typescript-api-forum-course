import type { Handler } from 'express'

/**
 * Middleware to validate Content-Type header for requests with body.
 * Ensures that POST, PUT, and PATCH requests have application/json content type.
 */
export const createContentTypeMiddleware = (): Handler => {
    return (request, response, next) => {
        const methodsWithBody = ['POST', 'PUT', 'PATCH']

        // Skip validation for methods without body or if no body present
        if (!methodsWithBody.includes(request.method)) {
            next()
            return
        }

        // Skip if content-length is 0 or not present
        const contentLength = request.headers['content-length']
        if (!contentLength || contentLength === '0') {
            next()
            return
        }

        const contentType = request.headers['content-type']

        // Allow multipart/form-data for file uploads
        if (contentType?.includes('multipart/form-data')) {
            next()
            return
        }

        // Require application/json for other requests with body
        if (!contentType?.includes('application/json')) {
            response.status(415).json({
                message: 'Unsupported Media Type. Content-Type must be application/json',
            })
            return
        }

        next()
    }
}
