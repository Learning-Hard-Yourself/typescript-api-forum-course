import { count, eq, sql } from 'drizzle-orm'

import type { UserStats } from '@/app/features/users/models/UserStats'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads, users } from '@/config/schema'

export interface UserStatsRetrieverInput {
    userId: string
}

export class UserStatsRetriever {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: UserStatsRetrieverInput): Promise<UserStats> {
        const { userId } = input

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
