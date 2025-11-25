import type { Auth } from 'better-auth'
import type { Request } from 'express'

import type { ForumDatabase } from '@/config/database-types'
import { AuthUserFetcher } from './AuthUserFetcher'
import { toWebRequest } from './helpers'

export interface GetCurrentUserResult {
    user: {
        id: string
        username: string
        email: string
        displayName: string
        avatarUrl: string | null
        role: string
    }
}

export class GetCurrentUser {
    private readonly userFetcher: AuthUserFetcher

    constructor(
        private readonly auth: Auth,
        private readonly database: ForumDatabase,
    ) {
        this.userFetcher = new AuthUserFetcher(database)
    }

    async execute(req: Request): Promise<GetCurrentUserResult> {
        // Call better-auth handler
        const webRequest = toWebRequest(req, '/api/auth/get-session')
        const betterAuthResponse = await this.auth.handler(webRequest)

        // Parse response
        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        if (betterAuthResponse.status !== 200 || !body?.user) {
            throw new Error('Unauthorized')
        }

        // Fetch and format the complete user
        const safeUser = await this.userFetcher.fetchAndFormatUser(body.user)

        return { user: safeUser }
    }
}
