import type { Handler, Request } from 'express'


const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i


export function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value)
}


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


export const validateIdParam: Handler = validateUuid('id')


export const validateThreadIdParam: Handler = validateUuid('threadId')


export const validateCategoryIdParam: Handler = validateUuid('categoryId')


export const validateUserIdParam: Handler = validateUuid('userId')
