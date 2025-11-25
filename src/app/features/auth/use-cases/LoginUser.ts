import type { Auth } from 'better-auth'
import type { Request, Response } from 'express'

import type { ForumDatabase } from '@/config/database-types'
import { AuthUserFetcher } from './AuthUserFetcher'
import { applyCookies, toWebRequest } from './helpers'

export interface LoginUserData {
    email: string
    password: string
}

export interface LoginUserResult {
    user: {
        id: string
        username: string
        email: string
        displayName: string
        avatarUrl: string | null
        role: string
    }
}

export class LoginUser {
    private readonly userFetcher: AuthUserFetcher

    constructor(
        private readonly auth: Auth,
        private readonly database: ForumDatabase,
    ) {
        this.userFetcher = new AuthUserFetcher(database)
    }

    async execute(req: Request, res: Response, data: LoginUserData): Promise<LoginUserResult> {

        const webRequest = toWebRequest(req, '/api/auth/sign-in/email')
        const betterAuthResponse = await this.auth.handler(webRequest)

        applyCookies(betterAuthResponse, res)

        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        if (betterAuthResponse.status === 401 || !body?.user) {
            throw new Error('Invalid credentials')
        }

        const safeUser = await this.userFetcher.fetchAndFormatUser(body.user, data.email)

        return { user: safeUser }
    }
}
