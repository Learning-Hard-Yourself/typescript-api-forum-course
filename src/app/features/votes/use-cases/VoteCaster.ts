import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Vote, VoteType } from '@/app/features/votes/models/Vote'
import { calculateVoteDelta, validateVote } from '@/app/features/votes/models/Vote'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, votes } from '@/config/schema'

export interface VoteCasterInput {
    postId: string
    userId: string
    voteType: VoteType
}

export interface VoteCasterResult {
    vote: Vote
    score: number
}

/**
 * Use case for casting a vote on a post.
 */
export class VoteCaster {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: VoteCasterInput): Promise<VoteCasterResult> {
        const { postId, userId, voteType } = input

        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        const existingVote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        const delta = calculateVoteDelta(existingVote, voteType)

        let resultVote: Vote

        if (existingVote) {
            const [updated] = await this.database
                .update(votes)
                .set({
                    voteType,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(votes.id, existingVote.id))
                .returning()

            resultVote = updated
        } else {
            const [created] = await this.database
                .insert(votes)
                .values({
                    id: uuidv7(),
                    postId,
                    userId,
                    voteType,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
                .returning()

            resultVote = created
        }

        const [updatedPost] = await this.database
            .update(posts)
            .set({
                voteScore: post.voteScore + delta,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
            .returning()

        const validatedVote = validateVote(resultVote)

        return {
            vote: validatedVote,
            score: updatedPost.voteScore,
        }
    }
}
