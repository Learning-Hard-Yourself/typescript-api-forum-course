

import type { NextFunction, Request, RequestHandler, Response } from 'express'

// ============================================
// Tuple Utility Types
// ============================================


export type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U]


export type Prepend<E, T extends unknown[]> = [E, ...T]


export type Append<T extends unknown[], E> = [...T, E]


export type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never


export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never


export type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never


export type Init<T extends unknown[]> = T extends [...infer I, unknown] ? I : never


export type Length<T extends unknown[]> = T['length']


export type Reverse<T extends unknown[]> = T extends [infer F, ...infer R]
    ? [...Reverse<R>, F]
    : []


export type IsEmpty<T extends unknown[]> = T extends [] ? true : false


export type ElementAt<T extends unknown[], N extends number> = T[N]

// ============================================
// Middleware Types
// ============================================


export interface NamedMiddleware<TName extends string = string> {
    readonly name: TName
    readonly handler: RequestHandler
}


export function createMiddleware<TName extends string>(
    name: TName,
    handler: RequestHandler,
): NamedMiddleware<TName> {
    return { name, handler }
}

// ============================================
// Middleware Pipeline
// ============================================


export class MiddlewarePipeline<TMiddlewares extends NamedMiddleware[] = []> {
    private readonly middlewares: TMiddlewares

    private constructor(middlewares: TMiddlewares) {
        this.middlewares = middlewares
    }

    
    static create(): MiddlewarePipeline<[]> {
        return new MiddlewarePipeline([])
    }

    
    use<TName extends string>(
        middleware: NamedMiddleware<TName>,
    ): MiddlewarePipeline<Append<TMiddlewares, NamedMiddleware<TName>>> {
        return new MiddlewarePipeline([...this.middlewares, middleware] as Append<
            TMiddlewares,
            NamedMiddleware<TName>
        >)
    }

    
    prepend<TName extends string>(
        middleware: NamedMiddleware<TName>,
    ): MiddlewarePipeline<Prepend<NamedMiddleware<TName>, TMiddlewares>> {
        return new MiddlewarePipeline([middleware, ...this.middlewares] as Prepend<
            NamedMiddleware<TName>,
            TMiddlewares
        >)
    }

    
    merge<TOther extends NamedMiddleware[]>(
        other: MiddlewarePipeline<TOther>,
    ): MiddlewarePipeline<Concat<TMiddlewares, TOther>> {
        return new MiddlewarePipeline([
            ...this.middlewares,
            ...other.getMiddlewares(),
        ] as Concat<TMiddlewares, TOther>)
    }

    
    getHandlers(): RequestHandler[] {
        return this.middlewares.map((m) => m.handler)
    }

    
    getMiddlewares(): TMiddlewares {
        return this.middlewares
    }

    
    getNames(): { [K in keyof TMiddlewares]: TMiddlewares[K] extends NamedMiddleware<infer N> ? N : never } {
        return this.middlewares.map((m) => m.name) as {
            [K in keyof TMiddlewares]: TMiddlewares[K] extends NamedMiddleware<infer N> ? N : never
        }
    }

    
    get length(): Length<TMiddlewares> {
        return this.middlewares.length as Length<TMiddlewares>
    }

    
    isEmpty(): this is MiddlewarePipeline<[]> {
        return this.middlewares.length === 0
    }
}

// ============================================
// Common Middleware Factories
// ============================================


export function authMiddleware(): NamedMiddleware<'auth'> {
    return createMiddleware('auth', (req: Request, _res: Response, next: NextFunction) => {
        // Auth logic here
        if (!req.headers.authorization) {
            return next(new Error('Unauthorized'))
        }
        return next()
    })
}


export function rateLimitMiddleware(maxRequests: number): NamedMiddleware<'rateLimit'> {
    return createMiddleware('rateLimit', (_req: Request, _res: Response, next: NextFunction) => {
        // Rate limit logic here
        console.log(`Rate limit: ${maxRequests} requests`)
        return next()
    })
}


export function loggingMiddleware(): NamedMiddleware<'logging'> {
    return createMiddleware('logging', (req: Request, _res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`)
        return next()
    })
}


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
