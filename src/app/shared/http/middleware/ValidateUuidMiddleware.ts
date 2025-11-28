import type { Handler, Request } from 'express'

/**
 * UUID v4/v7 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates that a string is a valid UUID
 */
export function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}

/**
 * Middleware factory to validate UUID parameters in routes.
 * 
 * @param paramNames - Array of parameter names to validate as UUIDs
 * @returns Express middleware that validates the specified parameters
 * 
 * @example
 * router.get('/posts/:id', validateUuid('id'), controller.show)
 * router.get('/users/:userId/posts/:postId', validateUuid('userId', 'postId'), controller.show)
 */
export function validateUuid(...paramNames: string[]): Handler {
    return (request: Request, response, next) => {
        const invalidParams: string[] = []

        for (const paramName of paramNames) {
            const value = request.params[paramName]

            if (value && !isValidUuid(value)) {
                invalidParams.push(paramName)
            }
        }

        if (invalidParams.length > 0) {
            response.status(400).json({
                message: 'Invalid UUID format',
                errors: invalidParams.map(param => ({
                    field: param,
                    message: `Parameter '${param}' must be a valid UUID`,
                })),
            })
            return
        }

        next()
    }
}

/**
 * Middleware to validate 'id' parameter as UUID (most common case)
 */
export const validateIdParam: Handler = validateUuid('id')

/**
 * Middleware to validate 'threadId' parameter as UUID
 */
export const validateThreadIdParam: Handler = validateUuid('threadId')

/**
 * Middleware to validate 'categoryId' parameter as UUID
 */
export const validateCategoryIdParam: Handler = validateUuid('categoryId')

/**
 * Middleware to validate 'userId' parameter as UUID
 */
export const validateUserIdParam: Handler = validateUuid('userId')
