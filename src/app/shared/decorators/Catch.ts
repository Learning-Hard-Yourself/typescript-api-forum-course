/**
 * Error Handling Decorators.
 * 
 * TypeScript Concept: Decorators with Error Handling
 * - Decorators can wrap methods to catch and transform errors
 * - Useful for consistent error handling across controllers
 * - Can convert exceptions to HTTP responses
 */

import { ApplicationError } from '@/app/shared/errors/ApplicationError'
import { HttpStatus } from '@/app/shared/http/HttpStatus'
import { ConsoleLogger } from '@/app/shared/logging/Logger'
import type { NextFunction, Request, Response } from 'express'

const logger = ConsoleLogger.create({ name: 'error-handler' })

/**
 * @Catch decorator - catches errors in controller methods
 * and passes them to Express error handler
 * 
 * Usage:
 * class PostsController {
 *     @Catch
 *     async create(req: Request, res: Response, next: NextFunction) { ... }
 * }
 */
export function Catch(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (
        req: Request,
        res: Response,
        next: NextFunction,
        ...args: unknown[]
    ) {
        try {
            return await originalMethod.call(this, req, res, next, ...args)
        } catch (error) {
            const className = target.constructor.name
            const methodName = String(propertyKey)

            logger.error(`Unhandled error in ${className}.${methodName}`, {
                error: error instanceof Error ? error.message : String(error),
                path: req.path,
                method: req.method,
            })

            next(error)
        }
    }

    return descriptor
}

/**
 * @CatchAndRespond decorator - catches errors and sends appropriate HTTP response
 * 
 * Usage:
 * class PostsController {
 *     @CatchAndRespond
 *     async create(req: Request, res: Response) { ... }
 * }
 */
export function CatchAndRespond(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (
        req: Request,
        res: Response,
        ...args: unknown[]
    ) {
        try {
            return await originalMethod.call(this, req, res, ...args)
        } catch (error) {
            const className = target.constructor.name
            const methodName = String(propertyKey)

            if (error instanceof ApplicationError) {
                logger.warn(`Application error in ${className}.${methodName}`, {
                    error: error.message,
                    statusCode: error.statusCode,
                    context: error.context,
                })

                return res.status(error.statusCode).json({
                    error: error.message,
                    ...(error.context && { details: error.context }),
                })
            }

            logger.error(`Unexpected error in ${className}.${methodName}`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            })

            return res.status(HttpStatus.InternalServerError).json({
                error: 'Internal server error',
            })
        }
    }

    return descriptor
}

/**
 * @CatchWith decorator factory - catches errors and handles with custom handler
 * 
 * Usage:
 * @CatchWith((error, req, res) => {
 *     res.status(400).json({ error: 'Custom error' })
 * })
 * async create(req: Request, res: Response) { ... }
 */
export function CatchWith(
    handler: (error: unknown, req: Request, res: Response) => void | Promise<void>,
) {
    return function (
        target: object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value

        descriptor.value = async function (
            req: Request,
            res: Response,
            ...args: unknown[]
        ) {
            try {
                return await originalMethod.call(this, req, res, ...args)
            } catch (error) {
                return handler(error, req, res)
            }
        }

        return descriptor
    }
}

/**
 * Class decorator to apply @Catch to all methods
 * 
 * Usage:
 * @CatchAll
 * class PostsController { ... }
 */
export function CatchAll<T extends new (...args: unknown[]) => object>(constructor: T) {
    const prototype = constructor.prototype
    const propertyNames = Object.getOwnPropertyNames(prototype)

    for (const propertyName of propertyNames) {
        if (propertyName === 'constructor') continue

        const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName)
        if (descriptor && typeof descriptor.value === 'function') {
            const originalMethod = descriptor.value

            descriptor.value = async function (
                req: Request,
                res: Response,
                next: NextFunction,
                ...args: unknown[]
            ) {
                try {
                    return await originalMethod.call(this, req, res, next, ...args)
                } catch (error) {
                    next(error)
                }
            }

            Object.defineProperty(prototype, propertyName, descriptor)
        }
    }

    return constructor
}
