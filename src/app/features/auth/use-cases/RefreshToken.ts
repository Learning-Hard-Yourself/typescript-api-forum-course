import type { Auth } from 'better-auth'
import type { Request, Response } from 'express'

import { applyCookies, extractAccessToken, extractSessionToken, toWebRequest } from './helpers'

export interface RefreshTokenResult {
    accessToken: string
}

export class RefreshToken {
    constructor(private readonly auth: Auth) { }

    /**
     * Refresh the access token using the session cookie.
     * This endpoint should be called when the access token expires.
     * The session cookie (httpOnly) is used to validate and generate a new access token.
     */
    async execute(req: Request, res: Response): Promise<RefreshTokenResult> {
        // Use get-session (GET) to validate current session from cookie
        const webRequest = toWebRequest(req, '/api/auth/get-session', 'GET')
        const betterAuthResponse = await this.auth.handler(webRequest)

        // Renew the session cookie
        applyCookies(betterAuthResponse, res)

        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        // Check for valid session (response may have session or user object)
        if (betterAuthResponse.status !== 200 || (!body?.session && !body?.user)) {
            throw new Error('Session expired')
        }

        // Extract access token: try header first, then body
        const accessToken = extractAccessToken(betterAuthResponse) ?? extractSessionToken(body)

        if (!accessToken) {
            throw new Error('Failed to refresh access token')
        }

        return { accessToken }
    }
}
