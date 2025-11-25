import type { NextFunction, Request, Response } from 'express'

interface RateLimitOptions {
    windowMs: number // Time window in milliseconds
    maxRequests: number // Maximum requests per window
    message?: string // Custom error message
    skipSuccessfulRequests?: boolean // Don't count successful requests
}

interface RequestRecord {
    count: number
    resetTime: number
}

/**
 * Rate Limit Middleware
 * 
 * Simple in-memory rate limiting based on IP address
 */
export class RateLimiter {
    private requests: Map<string, RequestRecord> = new Map()
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor(private readonly options: RateLimitOptions) {
        // Clean up expired entries every minute
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
        // Use IP address as key
        // In production, you might want to use user ID for authenticated requests
        return req.ip || req.socket.remoteAddress || 'unknown'
    }

    public middleware = (req: Request, res: Response, next: NextFunction): void => {
        // Skip rate limiting in test environment
        if (process.env.NODE_ENV === 'test') {
            next()
            return
        }

        const key = this.getKey(req)
        const now = Date.now()

        let record = this.requests.get(key)

        // Create new record or reset if window expired
        if (!record || record.resetTime < now) {
            record = {
                count: 0,
                resetTime: now + this.options.windowMs,
            }
            this.requests.set(key, record)
        }

        // Increment request count
        record.count++

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', this.options.maxRequests)
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.maxRequests - record.count))
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString())

        // Check if limit exceeded
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

/**
 * Create rate limit middleware
 */
export function createRateLimit(options: RateLimitOptions) {
    const limiter = new RateLimiter(options)
    return limiter.middleware
}

/**
 * Predefined rate limiters
 */
export const rateLimiters = {
    // Strict limit for authentication endpoints
    auth: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many authentication attempts, please try again later',
    }),

    // Limit for creating threads
    createThread: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5,
        message: 'Too many threads created, please try again later',
    }),

    // Limit for creating posts
    createPost: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10,
        message: 'Too many posts created, please try again later',
    }),

    // Limit for replies
    createReply: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20,
        message: 'Too many replies created, please try again later',
    }),

    // General API rate limit
    general: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests, please try again later',
    }),
}
