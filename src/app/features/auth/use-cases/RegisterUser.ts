import type { Auth } from 'better-auth'
import { eq, or } from 'drizzle-orm'
import type { Request, Response } from 'express'

import type { ForumDatabase } from '@/config/database-types'
import { users } from '@/config/schema'
import { AuthUserFetcher } from './AuthUserFetcher'
import { applyCookies, extractAccessToken, toWebRequest } from './helpers'

export interface RegisterUserData {
    username: string
    email: string
    password: string
    displayName: string
}

export interface RegisterUserResult {
    accessToken: string
    user: {
        id: string
        username: string
        email: string
        displayName: string
        avatarUrl: string | null
        role: string
    }
}

export class RegisterUser {
    private readonly userFetcher: AuthUserFetcher

    constructor(
        private readonly auth: Auth,
        private readonly database: ForumDatabase,
    ) {
        this.userFetcher = new AuthUserFetcher(database)
    }

    async execute(req: Request, res: Response, data: RegisterUserData): Promise<RegisterUserResult> {
        const { username, email, displayName } = data

        const predicates = []
        if (username) {
            predicates.push(eq(users.username, username))
        }
        if (email) {
            predicates.push(eq(users.email, email.toLowerCase()))
        }

        if (predicates.length > 0) {
            const where = predicates.length === 1 ? predicates[0] : or(...predicates)
            const existingUser = await this.database.query.users.findFirst({ where })

            if (existingUser) {
                throw new Error('User with provided email or username already exists')
            }
        }

        const webRequest = toWebRequest(req, '/api/auth/sign-up/email')
        const betterAuthResponse = await this.auth.handler(webRequest)

        // Apply refresh token cookie (httpOnly for security)
        applyCookies(betterAuthResponse, res)

        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        if (betterAuthResponse.status !== 200 || !body?.user) {
            console.error('BETTER-AUTH FAILURE:', {
                status: betterAuthResponse.status,
                body,
                headers: Object.fromEntries(betterAuthResponse.headers.entries())
            })
            throw new Error('Failed to register user')
        }

        // Extract access token: try header first, then body
        const accessToken = extractAccessToken(betterAuthResponse) ?? extractSessionToken(body)

        if (!accessToken) {
            console.error('ACCESS-TOKEN NOT FOUND. Headers:', Object.fromEntries(betterAuthResponse.headers.entries()))
            console.error('Body:', body)
            throw new Error('Failed to generate access token')
        }

        const safeUser = await this.userFetcher.fetchAndFormatUser(
            body.user,
            email,
            username,
            displayName,
        )

        return { accessToken, user: safeUser }
    }
}
