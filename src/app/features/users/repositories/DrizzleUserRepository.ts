import { and, count, eq, ne, or, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { User } from '@/app/features/users/models/User'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads, users } from '@/config/schema'
import type { UserRepository, UserStats } from './UserRepository'

/**
 * Drizzle ORM implementation of UserRepository
 */
export class DrizzleUserRepository implements UserRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)

        return (user as User) ?? null
    }

    async findByEmail(email: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        return (user as User) ?? null
    }

    async findByUsername(username: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)

        return (user as User) ?? null
    }

    async save(user: Omit<User, 'id'>): Promise<User> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(users)
            .values({
                id: uuidv7(),
                ...user,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as User
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        const [updated] = await this.database
            .update(users)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(users.id, id))
            .returning()

        return updated as User
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(users).where(eq(users.id, id))
    }

    async findByEmailOrUsername(
        email: string,
        username: string,
        excludeId?: string,
    ): Promise<User | null> {
        const conditions = or(eq(users.email, email), eq(users.username, username))
        const whereClause = excludeId ? and(conditions, ne(users.id, excludeId)) : conditions

        const [user] = await this.database
            .select()
            .from(users)
            .where(whereClause)
            .limit(1)

        return (user as User) ?? null
    }

    async getStats(userId: string): Promise<UserStats> {
        const [threadResult] = await this.database
            .select({ count: count() })
            .from(threads)
            .where(eq(threads.authorId, userId))

        const [postResult] = await this.database
            .select({ count: count() })
            .from(posts)
            .where(eq(posts.authorId, userId))

        const [voteResult] = await this.database
            .select({ score: sql<number>`coalesce(sum(${posts.voteScore}), 0)` })
            .from(posts)
            .where(eq(posts.authorId, userId))

        const threadCount = threadResult?.count ?? 0
        const postCount = postResult?.count ?? 0
        const voteScore = voteResult?.score ?? 0

        const reputation = threadCount * 5 + postCount * 2 + voteScore

        const [user] = await this.database
            .select({ lastActiveAt: users.lastActiveAt })
            .from(users)
            .where(eq(users.id, userId))

        return {
            threadCount,
            postCount,
            reputation,
            lastActive: user?.lastActiveAt ?? null,
        }
    }
}
