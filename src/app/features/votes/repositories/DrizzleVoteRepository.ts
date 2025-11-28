import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Vote, VoteType } from '@/app/features/votes/models/Vote'
import type { ForumDatabase } from '@/config/database-types'
import { votes } from '@/config/schema'
import type { VoteRepository } from './VoteRepository'

/**
 * Drizzle ORM implementation of VoteRepository
 */
export class DrizzleVoteRepository implements VoteRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Vote | null> {
        const [vote] = await this.database
            .select()
            .from(votes)
            .where(eq(votes.id, id))
            .limit(1)

        return (vote as Vote) ?? null
    }

    async findByPostId(postId: string): Promise<Vote[]> {
        const result = await this.database
            .select()
            .from(votes)
            .where(eq(votes.postId, postId))

        return result as Vote[]
    }

    async findByUserId(userId: string): Promise<Vote[]> {
        const result = await this.database
            .select()
            .from(votes)
            .where(eq(votes.userId, userId))

        return result as Vote[]
    }

    async findByPostAndUser(postId: string, userId: string): Promise<Vote | null> {
        const [vote] = await this.database
            .select()
            .from(votes)
            .where(and(eq(votes.postId, postId), eq(votes.userId, userId)))
            .limit(1)

        return (vote as Vote) ?? null
    }

    async create(vote: Omit<Vote, 'id'>): Promise<Vote> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(votes)
            .values({
                id: uuidv7(),
                ...vote,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as Vote
    }

    async update(id: string, voteType: VoteType): Promise<Vote> {
        const [updated] = await this.database
            .update(votes)
            .set({ voteType, updatedAt: new Date().toISOString() })
            .where(eq(votes.id, id))
            .returning()

        return updated as Vote
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(votes).where(eq(votes.id, id))
    }

    async deleteByPostAndUser(postId: string, userId: string): Promise<void> {
        await this.database
            .delete(votes)
            .where(and(eq(votes.postId, postId), eq(votes.userId, userId)))
    }
}
