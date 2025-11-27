import type { Request, Response } from 'express'

export function toWebRequest(req: Request, pathname: string, method?: string): Request {
    const url = new URL(`http://localhost${pathname}`)
    const httpMethod = method ?? req.method

    if (req.query) {
        Object.entries(req.query).forEach(([key, value]) => {
            url.searchParams.append(key, String(value))
        })
    }

    const headers = new Headers()
    Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
            const headerValue = Array.isArray(value) ? value.join(', ') : String(value)
            headers.set(key, headerValue)
        }
    })

    return new Request(url, {
        method: httpMethod,
        headers,
        body: ['GET', 'HEAD'].includes(httpMethod) ? undefined : JSON.stringify(req.body),
    }) as any
}

/**
 * Apply session cookies from Better Auth response to Express response.
 * Cookies are configured as httpOnly for security (refresh token pattern).
 */
export function applyCookies(betterAuthResponse: globalThis.Response, expressResponse: Response): void {
    const getSetCookie = (betterAuthResponse.headers as any).getSetCookie?.()
    if (Array.isArray(getSetCookie)) {
        getSetCookie.forEach((cookie: string) => expressResponse.append('Set-Cookie', cookie))
    }
}

/**
 * Extract Bearer access token from Better Auth response header.
 * The bearer plugin sets this in the 'set-auth-token' header.
 */
export function extractAccessToken(betterAuthResponse: globalThis.Response): string | null {
    // Try the standard bearer plugin header first
    const headerToken = betterAuthResponse.headers.get('set-auth-token')
    if (headerToken) {
        return headerToken
    }

    // Fallback: try x-auth-token (alternative header name)
    const altToken = betterAuthResponse.headers.get('x-auth-token')
    if (altToken) {
        return altToken
    }

    return null
}

/**
 * Extract access token from response body (session token).
 * This is used when the bearer plugin doesn't set headers.
 */
export function extractSessionToken(body: { token?: string; session?: { token?: string } } | null): string | null {
    if (!body) return null

    // Direct token in body
    if (body.token) {
        return body.token
    }

    // Token in session object
    if (body.session?.token) {
        return body.session.token
    }

    return null
}
