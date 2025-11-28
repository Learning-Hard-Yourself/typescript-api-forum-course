import { and, eq } from 'drizzle-orm'

import type { Vote, VoteScore } from '@/app/features/votes/models/Vote'
import { calculateVoteScore } from '@/app/features/votes/models/Vote'
import type { ForumDatabase } from '@/config/database-types'
import { votes } from '@/config/schema'

export interface VoteScoreRetrieverInput {
    postId: string
}

export interface UserVoteRetrieverInput {
    postId: string
    userId: string
}

/**
 * Use case for retrieving vote information.
 */
export class VoteRetriever {
    public constructor(private readonly database: ForumDatabase) {}

    public async getVoteScore(input: VoteScoreRetrieverInput): Promise<VoteScore> {
        const postVotes = await this.database.query.votes.findMany({
            where: eq(votes.postId, input.postId),
        })

        return calculateVoteScore(postVotes)
    }

    public async getUserVote(input: UserVoteRetrieverInput): Promise<Vote | null> {
        const vote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, input.postId), eq(votes.userId, input.userId)),
        })

        return vote ?? null
    }
}
