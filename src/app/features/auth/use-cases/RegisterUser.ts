import type { Auth } from 'better-auth'
import { eq, or } from 'drizzle-orm'
import type { Request, Response } from 'express'

import { users } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'
import { AuthUserFetcher } from './AuthUserFetcher'
import { applyCookies, toWebRequest } from './helpers'

export interface RegisterUserData {
    username: string
    email: string
    password: string
    displayName: string
}

export interface RegisterUserResult {
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
        const { username, email, password, displayName } = data

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

        applyCookies(betterAuthResponse, res)

        const rawBody = await betterAuthResponse.text()
        const body = rawBody ? JSON.parse(rawBody) : null

        if (betterAuthResponse.status !== 200 || !body?.user) {
            throw new Error('Failed to register user')
        }

        const safeUser = await this.userFetcher.fetchAndFormatUser(
            body.user,
            email,
            username,
            displayName,
        )

        return { user: safeUser }
    }
}
