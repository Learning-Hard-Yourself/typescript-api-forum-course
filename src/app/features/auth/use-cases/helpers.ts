import type { Request, Response } from 'express'

/**
 * Converts Express Request to Web API Request for better-auth
 */
export function toWebRequest(req: Request, pathname: string): Request {
    const url = new URL(`http://localhost${pathname}`)

    // Copy query parameters
    if (req.query) {
        Object.entries(req.query).forEach(([key, value]) => {
            url.searchParams.append(key, String(value))
        })
    }

    // Copy headers
    const headers = new Headers()
    Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
            const headerValue = Array.isArray(value) ? value.join(', ') : String(value)
            headers.set(key, headerValue)
        }
    })

    // Create Web Request
    return new Request(url, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    }) as any
}

/**
 * Applies Set-Cookie headers from better-auth response to Express response
 */
export function applyCookies(betterAuthResponse: globalThis.Response, expressResponse: Response): void {
    const getSetCookie = (betterAuthResponse.headers as any).getSetCookie?.()
    if (Array.isArray(getSetCookie)) {
        getSetCookie.forEach((cookie: string) => expressResponse.append('Set-Cookie', cookie))
    }
}
