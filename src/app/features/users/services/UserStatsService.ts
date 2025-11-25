import { count, eq, sql } from 'drizzle-orm'

import type { UserStats, UserWithStats } from '@/app/features/users/models/UserStats'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads, users } from '@/config/schema'

export class UserStatsService {
    constructor(private readonly database: ForumDatabase) { }

    /**
     * Calculate user statistics on-the-fly
     */
    async getUserStats(userId: string): Promise<UserStats> {
        // 1. Count threads
        const [threadResult] = await this.database
            .select({ count: count() })
            .from(threads)
            .where(eq(threads.authorId, userId))

        // 2. Count posts
        const [postResult] = await this.database
            .select({ count: count() })
            .from(posts)
            .where(eq(posts.authorId, userId))

        // 3. Calculate Vote Score (Reputation)
        // Sum of votes on user's posts
        // We need to join posts and votes
        const [voteResult] = await this.database
            .select({ score: sql<number>`coalesce(sum(${posts.voteScore}), 0)` })
            .from(posts)
            .where(eq(posts.authorId, userId))

        const threadCount = threadResult?.count ?? 0
        const postCount = postResult?.count ?? 0
        const voteScore = voteResult?.score ?? 0

        // Reputation Formula:
        // (Threads * 5) + (Posts * 2) + VoteScore
        const reputation = threadCount * 5 + postCount * 2 + voteScore

        // 4. Get Last Active
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

    /**
     * Get User with Stats (Intersection Type)
     */
    async getUserWithStats(userId: string): Promise<UserWithStats | null> {
        const [user] = await this.database.select().from(users).where(eq(users.id, userId))

        if (!user) return null

        const stats = await this.getUserStats(userId)

        // Combine User and Stats using spread
        // Matches the UserWithStats Intersection Type
        return {
            ...user,
            stats,
        }
    }
}
