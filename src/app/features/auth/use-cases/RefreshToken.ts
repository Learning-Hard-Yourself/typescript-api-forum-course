import type { Auth } from 'better-auth'
import type { Request, Response } from 'express'

import { applyCookies, extractAccessToken, extractSessionToken, toWebRequest } from './helpers'

export interface RefreshTokenResult {
    accessToken: string
}

export class RefreshToken {
    constructor(private readonly auth: Auth) { }

    async execute(req: Request, res: Response): Promise<RefreshTokenResult> {
        const webRequest = toWebRequest(req, '/api/auth/get-session', 'GET')
        const betterAuthResponse = await this.auth.handler(webRequest)

        applyCookies(betterAuthResponse, res)

        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        if (betterAuthResponse.status !== 200 || (!body?.session && !body?.user)) {
            throw new Error('Session expired')
        }

        const accessToken = extractAccessToken(betterAuthResponse) ?? extractSessionToken(body)

        if (!accessToken) {
            throw new Error('Failed to refresh access token')
        }

        return { accessToken }
    }
}
