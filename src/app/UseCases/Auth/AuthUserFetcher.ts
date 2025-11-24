import { eq } from 'drizzle-orm'

import { users } from '@/database/schema'
import type { ForumDatabase } from '@/database/types'

export interface SafeUser {
    id: string
    username: string
    email: string
    displayName: string
    avatarUrl: string | null
    role: string
}

export class AuthUserFetcher {
    constructor(private readonly database: ForumDatabase) { }

    async fetchAndFormatUser(
        betterAuthUser: any,
        fallbackEmail?: string,
        fallbackUsername?: string,
        fallbackDisplayName?: string,
    ): Promise<SafeUser> {
        const userId = betterAuthUser?.id ?? null
        const userEmail = betterAuthUser?.email ?? fallbackEmail?.toLowerCase() ?? null
        let fullUser = null

        if (userId) {
            fullUser = await this.database.query.users.findFirst({ where: eq(users.id, userId) })
        }
        if (!fullUser && userEmail) {
            fullUser = await this.database.query.users.findFirst({ where: eq(users.email, userEmail) })
        }

        if (fullUser) {
            return {
                id: fullUser.id,
                username: fullUser.username,
                email: fullUser.email,
                displayName: fullUser.displayName,
                avatarUrl: fullUser.avatarUrl,
                role: fullUser.role,
            }
        }

        return {
            id: betterAuthUser?.id ?? '',
            username: fallbackUsername ?? fullUser?.username ?? '',
            email: betterAuthUser?.email ?? fallbackEmail ?? '',
            displayName: fallbackDisplayName ?? betterAuthUser?.name ?? fullUser?.displayName ?? '',
            avatarUrl: betterAuthUser?.image ?? fullUser?.avatarUrl ?? null,
            role: fullUser?.role ?? 'user',
        }
    }
}
