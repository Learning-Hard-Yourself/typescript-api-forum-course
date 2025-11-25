import type { Auth } from 'better-auth'
import type { Request, Response } from 'express'

import { applyCookies, toWebRequest } from './helpers'

export class LogoutUser {
    constructor(private readonly auth: Auth) { }

    async execute(req: Request, res: Response): Promise<void> {
        // Call better-auth handler
        const webRequest = toWebRequest(req, '/api/auth/sign-out')
        const betterAuthResponse = await this.auth.handler(webRequest)

        // Apply cookies
        applyCookies(betterAuthResponse, res)
    }
}
