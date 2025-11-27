/**
 * Middleware Pipeline with Variadic Tuple Types.
 * 
 * TypeScript Concepts:
 * - Variadic tuple types [...T] for spreading tuples
 * - Concat, Prepend, Append operations on tuples
 * - Type-safe middleware chaining
 * - First, Last, Rest tuple utilities
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express'

// ============================================
// Tuple Utility Types
// ============================================

/**
 * Concatenate two tuples
 */
export type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U]

/**
 * Prepend an element to a tuple
 */
export type Prepend<E, T extends unknown[]> = [E, ...T]

/**
 * Append an element to a tuple
 */
export type Append<T extends unknown[], E> = [...T, E]

/**
 * Get the first element of a tuple
 */
export type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never

/**
 * Get the last element of a tuple
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never

/**
 * Get all elements except the first
 */
export type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never

/**
 * Get all elements except the last
 */
export type Init<T extends unknown[]> = T extends [...infer I, unknown] ? I : never

/**
 * Get the length of a tuple
 */
export type Length<T extends unknown[]> = T['length']

/**
 * Reverse a tuple
 */
export type Reverse<T extends unknown[]> = T extends [infer F, ...infer R]
    ? [...Reverse<R>, F]
    : []

/**
 * Check if tuple is empty
 */
export type IsEmpty<T extends unknown[]> = T extends [] ? true : false

/**
 * Get element at index
 */
export type ElementAt<T extends unknown[], N extends number> = T[N]

// ============================================
// Middleware Types
// ============================================

/**
 * Named middleware with metadata
 */
export interface NamedMiddleware<TName extends string = string> {
    readonly name: TName
    readonly handler: RequestHandler
}

/**
 * Create a named middleware
 */
export function createMiddleware<TName extends string>(
    name: TName,
    handler: RequestHandler,
): NamedMiddleware<TName> {
    return { name, handler }
}

// ============================================
// Middleware Pipeline
// ============================================

/**
 * Type-safe middleware pipeline that tracks middleware types
 */
export class MiddlewarePipeline<TMiddlewares extends NamedMiddleware[] = []> {
    private readonly middlewares: TMiddlewares

    private constructor(middlewares: TMiddlewares) {
        this.middlewares = middlewares
    }

    /**
     * Create an empty pipeline
     */
    static create(): MiddlewarePipeline<[]> {
        return new MiddlewarePipeline([])
    }

    /**
     * Add a middleware to the end of the pipeline
     * Uses variadic tuple types to track the order
     */
    use<TName extends string>(
        middleware: NamedMiddleware<TName>,
    ): MiddlewarePipeline<Append<TMiddlewares, NamedMiddleware<TName>>> {
        return new MiddlewarePipeline([...this.middlewares, middleware] as Append<
            TMiddlewares,
            NamedMiddleware<TName>
        >)
    }

    /**
     * Add a middleware to the beginning of the pipeline
     */
    prepend<TName extends string>(
        middleware: NamedMiddleware<TName>,
    ): MiddlewarePipeline<Prepend<NamedMiddleware<TName>, TMiddlewares>> {
        return new MiddlewarePipeline([middleware, ...this.middlewares] as Prepend<
            NamedMiddleware<TName>,
            TMiddlewares
        >)
    }

    /**
     * Merge with another pipeline
     */
    merge<TOther extends NamedMiddleware[]>(
        other: MiddlewarePipeline<TOther>,
    ): MiddlewarePipeline<Concat<TMiddlewares, TOther>> {
        return new MiddlewarePipeline([
            ...this.middlewares,
            ...other.getMiddlewares(),
        ] as Concat<TMiddlewares, TOther>)
    }

    /**
     * Get all middleware handlers as an array
     */
    getHandlers(): RequestHandler[] {
        return this.middlewares.map((m) => m.handler)
    }

    /**
     * Get all middleware metadata
     */
    getMiddlewares(): TMiddlewares {
        return this.middlewares
    }

    /**
     * Get middleware names
     */
    getNames(): { [K in keyof TMiddlewares]: TMiddlewares[K] extends NamedMiddleware<infer N> ? N : never } {
        return this.middlewares.map((m) => m.name) as {
            [K in keyof TMiddlewares]: TMiddlewares[K] extends NamedMiddleware<infer N> ? N : never
        }
    }

    /**
     * Get the number of middlewares
     */
    get length(): Length<TMiddlewares> {
        return this.middlewares.length as Length<TMiddlewares>
    }

    /**
     * Check if pipeline is empty
     */
    isEmpty(): this is MiddlewarePipeline<[]> {
        return this.middlewares.length === 0
    }
}

// ============================================
// Common Middleware Factories
// ============================================

/**
 * Create an authentication middleware
 */
export function authMiddleware(): NamedMiddleware<'auth'> {
    return createMiddleware('auth', (req: Request, _res: Response, next: NextFunction) => {
        // Auth logic here
        if (!req.headers.authorization) {
            return next(new Error('Unauthorized'))
        }
        return next()
    })
}

/**
 * Create a rate limit middleware
 */
export function rateLimitMiddleware(maxRequests: number): NamedMiddleware<'rateLimit'> {
    return createMiddleware('rateLimit', (_req: Request, _res: Response, next: NextFunction) => {
        // Rate limit logic here
        console.log(`Rate limit: ${maxRequests} requests`)
        return next()
    })
}

/**
 * Create a logging middleware
 */
export function loggingMiddleware(): NamedMiddleware<'logging'> {
    return createMiddleware('logging', (req: Request, _res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`)
        return next()
    })
}

/**
 * Create a role check middleware
 */
export function requireRoleMiddleware(role: string): NamedMiddleware<'requireRole'> {
    return createMiddleware('requireRole', (req: Request, _res: Response, next: NextFunction) => {
        // Role check logic
        console.log(`Checking role: ${role}`)
        return next()
    })
}

// ============================================
// Usage Example
// ============================================

/**
 * Example: Create a typed middleware pipeline
 * 
 * const pipeline = MiddlewarePipeline.create()
 *     .use(loggingMiddleware())
 *     .use(rateLimitMiddleware(100))
 *     .use(authMiddleware())
 *     .use(requireRoleMiddleware('admin'))
 * 
 * // Type of pipeline.getNames():
 * // ['logging', 'rateLimit', 'auth', 'requireRole']
 * 
 * // Use in Express routes:
 * router.get('/admin', ...pipeline.getHandlers(), adminHandler)
 */

// Pre-built pipelines for common use cases
export const publicPipeline = MiddlewarePipeline.create()
    .use(loggingMiddleware())
    .use(rateLimitMiddleware(100))

export const authenticatedPipeline = publicPipeline
    .use(authMiddleware())

export const adminPipeline = authenticatedPipeline
    .use(requireRoleMiddleware('admin'))

// Export types for the pipelines
export type PublicPipeline = typeof publicPipeline
export type AuthenticatedPipeline = typeof authenticatedPipeline
export type AdminPipeline = typeof adminPipeline
