import type { NextFunction, Request, Response } from 'express'

interface RateLimitOptions {
    windowMs: number
    maxRequests: number
    message?: string
    skipSuccessfulRequests?: boolean
}

interface RequestRecord {
    count: number
    resetTime: number
}

export class RateLimiter {
    private requests: Map<string, RequestRecord> = new Map()
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor(private readonly options: RateLimitOptions) {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }

    private cleanup(): void {
        const now = Date.now()
        for (const [key, record] of this.requests.entries()) {
            if (record.resetTime < now) {
                this.requests.delete(key)
            }
        }
    }

    private getKey(req: Request): string {
        return req.ip || req.socket.remoteAddress || 'unknown'
    }

    public middleware = (req: Request, res: Response, next: NextFunction): void => {
        if (process.env.NODE_ENV === 'test') {
            next()
            return
        }

        const key = this.getKey(req)
        const now = Date.now()

        let record = this.requests.get(key)

        if (!record || record.resetTime < now) {
            record = {
                count: 0,
                resetTime: now + this.options.windowMs,
            }
            this.requests.set(key, record)
        }

        record.count++

        res.setHeader('X-RateLimit-Limit', this.options.maxRequests)
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - record.count))
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString())

        if (record.count > this.options.maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000)
            res.setHeader('Retry-After', retryAfter)

            res.status(429).json({
                message: this.options.message || 'Too many requests, please try again later',
                retryAfter,
            })
            return
        }

        next()
    }

    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
        this.requests.clear()
    }
}

export function createRateLimit(options: RateLimitOptions) {
    const limiter = new RateLimiter(options)
    return limiter.middleware
}

export const rateLimiters = {
    auth: createRateLimit({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        message: 'Too many authentication attempts, please try again later',
    }),

    createThread: createRateLimit({
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
        message: 'Too many threads created, please try again later',
    }),

    createPost: createRateLimit({
        windowMs: 60 * 60 * 1000,
        maxRequests: 10,
        message: 'Too many posts created, please try again later',
    }),

    createReply: createRateLimit({
        windowMs: 60 * 60 * 1000,
        maxRequests: 20,
        message: 'Too many replies created, please try again later',
    }),

    general: createRateLimit({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        message: 'Too many requests, please try again later',
    }),
}
