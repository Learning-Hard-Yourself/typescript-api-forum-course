import type { Response } from 'express'
import { createHash } from 'node:crypto'



export interface LocationOptions {
    
    basePath: string
    
    resourceId: string
}

export interface CacheOptions {
    
    directive: 'no-store' | 'no-cache' | 'private' | 'public'
    
    maxAge?: number
    
    mustRevalidate?: boolean
}

export interface ETagOptions {
    
    data: unknown
    
    weak?: boolean
}


export function setLocationHeader(res: Response, options: LocationOptions): Response {
    const location = `${options.basePath}/${options.resourceId}`
    return res.set('Location', location)
}


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


export function setETagHeader(res: Response, options: ETagOptions): Response {
    const jsonData = JSON.stringify(options.data)
    const hash = createHash('md5').update(jsonData).digest('hex')
    const etag = options.weak ? `W/"${hash}"` : `"${hash}"`
    return res.set('ETag', etag)
}


export function setLastModifiedHeader(res: Response, date: Date): Response {
    return res.set('Last-Modified', date.toUTCString())
}


export function setRequestIdHeader(res: Response, requestId: string): Response {
    return res.set('X-Request-Id', requestId)
}


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


export function headers(res: Response): ResponseHeaderBuilder {
    return new ResponseHeaderBuilder(res)
}


export const CachePresets = {
    
    noStore: { directive: 'no-store' } as CacheOptions,

    
    noCache: { directive: 'no-cache' } as CacheOptions,

    
    privateShort: { directive: 'private', maxAge: 300, mustRevalidate: true } as CacheOptions,

    
    privateLong: { directive: 'private', maxAge: 3600, mustRevalidate: true } as CacheOptions,

    
    publicShort: { directive: 'public', maxAge: 300 } as CacheOptions,

    
    publicLong: { directive: 'public', maxAge: 3600 } as CacheOptions,

    
    immutable: { directive: 'public', maxAge: 31536000 } as CacheOptions,
} as const
