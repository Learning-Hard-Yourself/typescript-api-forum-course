import type { Response } from 'express'
import { createHash } from 'node:crypto'

/**
 * HTTP Response Headers Utility
 * 
 * Provides standardized headers following REST best practices:
 * - Location: URI of created resource (RFC 7231)
 * - ETag: Entity tag for caching (RFC 7232)
 * - Cache-Control: Caching directives (RFC 7234)
 * - X-Request-Id: Request tracing
 * - Last-Modified: Resource modification time
 */

export interface LocationOptions {
    /** Base path for the resource (e.g., '/api/v1/posts') */
    basePath: string
    /** Resource ID */
    resourceId: string
}

export interface CacheOptions {
    /** Cache directive: 'no-store' | 'no-cache' | 'private' | 'public' */
    directive: 'no-store' | 'no-cache' | 'private' | 'public'
    /** Max age in seconds (only for 'private' or 'public') */
    maxAge?: number
    /** Whether to add must-revalidate */
    mustRevalidate?: boolean
}

export interface ETagOptions {
    /** Data to generate ETag from */
    data: unknown
    /** Whether it's a weak ETag */
    weak?: boolean
}

/**
 * Sets the Location header for created resources.
 * Use with 201 Created responses.
 */
export function setLocationHeader(res: Response, options: LocationOptions): Response {
    const location = `${options.basePath}/${options.resourceId}`
    return res.set('Location', location)
}

/**
 * Sets Cache-Control header based on options.
 */
export function setCacheHeader(res: Response, options: CacheOptions): Response {
    let value = options.directive

    if ((options.directive === 'private' || options.directive === 'public') && options.maxAge !== undefined) {
        value += `, max-age=${options.maxAge}`
    }

    if (options.mustRevalidate) {
        value += ', must-revalidate'
    }

    return res.set('Cache-Control', value)
}

/**
 * Generates and sets an ETag header.
 * ETags are useful for conditional requests (If-None-Match).
 */
export function setETagHeader(res: Response, options: ETagOptions): Response {
    const jsonData = JSON.stringify(options.data)
    const hash = createHash('md5').update(jsonData).digest('hex')
    const etag = options.weak ? `W/"${hash}"` : `"${hash}"`
    return res.set('ETag', etag)
}

/**
 * Sets Last-Modified header.
 */
export function setLastModifiedHeader(res: Response, date: Date): Response {
    return res.set('Last-Modified', date.toUTCString())
}

/**
 * Sets X-Request-Id header for request tracing.
 * Usually set by middleware, but can be used in responses.
 */
export function setRequestIdHeader(res: Response, requestId: string): Response {
    return res.set('X-Request-Id', requestId)
}

/**
 * Fluent builder for setting multiple headers.
 */
export class ResponseHeaderBuilder {
    constructor(private readonly res: Response) {}

    public location(options: LocationOptions): this {
        setLocationHeader(this.res, options)
        return this
    }

    public cache(options: CacheOptions): this {
        setCacheHeader(this.res, options)
        return this
    }

    public etag(options: ETagOptions): this {
        setETagHeader(this.res, options)
        return this
    }

    public lastModified(date: Date): this {
        setLastModifiedHeader(this.res, date)
        return this
    }

    public requestId(id: string): this {
        setRequestIdHeader(this.res, id)
        return this
    }

    public custom(name: string, value: string): this {
        this.res.set(name, value)
        return this
    }

    public getResponse(): Response {
        return this.res
    }
}

/**
 * Creates a response header builder for fluent API.
 * 
 * @example
 * ```typescript
 * headers(res)
 *   .location({ basePath: '/api/v1/posts', resourceId: post.id })
 *   .cache({ directive: 'private', maxAge: 300 })
 *   .getResponse()
 *   .status(201)
 *   .json({ data: post })
 * ```
 */
export function headers(res: Response): ResponseHeaderBuilder {
    return new ResponseHeaderBuilder(res)
}

/**
 * Common cache presets for different resource types.
 */
export const CachePresets = {
    /** No caching at all - for sensitive data */
    noStore: { directive: 'no-store' } as CacheOptions,

    /** No caching - for frequently changing data */
    noCache: { directive: 'no-cache' } as CacheOptions,

    /** Private cache for 5 minutes - for user-specific data */
    privateShort: { directive: 'private', maxAge: 300, mustRevalidate: true } as CacheOptions,

    /** Private cache for 1 hour */
    privateLong: { directive: 'private', maxAge: 3600, mustRevalidate: true } as CacheOptions,

    /** Public cache for 5 minutes - for public lists */
    publicShort: { directive: 'public', maxAge: 300 } as CacheOptions,

    /** Public cache for 1 hour - for static-ish content */
    publicLong: { directive: 'public', maxAge: 3600 } as CacheOptions,

    /** Immutable content - for versioned assets */
    immutable: { directive: 'public', maxAge: 31536000 } as CacheOptions,
} as const
