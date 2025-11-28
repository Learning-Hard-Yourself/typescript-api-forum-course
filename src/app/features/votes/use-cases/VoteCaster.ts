import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Vote, VoteType } from '@/app/features/votes/models/Vote'
import { calculateVoteDelta, validateVote } from '@/app/features/votes/models/Vote'
import type { Result } from '@/app/shared/types/Result'
import { err, ok } from '@/app/shared/types/Result'
import type { ForumDatabase } from '@/config/database-types'
import { posts, votes } from '@/config/schema'

export interface VoteCasterInput {
    postId: string
    userId: string
    voteType: VoteType
}

export interface VoteCasterOutput {
    vote: Vote
    score: number
}

export type VoteCasterError =
    | { code: 'POST_NOT_FOUND'; postId: string }
    | { code: 'DATABASE_ERROR'; message: string }

export class VoteCaster {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: VoteCasterInput): Promise<Result<VoteCasterOutput, VoteCasterError>> {
        const { postId, userId, voteType } = input

        const post = await this.findPostById(postId)
        if (!post) {
            return err({ code: 'POST_NOT_FOUND', postId })
        }

        const existingVote = await this.findExistingVote(postId, userId)
        const delta = calculateVoteDelta(existingVote, voteType)

        const resultVote = existingVote
            ? await this.updateVote(existingVote.id, voteType)
            : await this.createVote(postId, userId, voteType)

        const updatedPost = await this.updatePostScore(postId, post.voteScore + delta)

        return ok({
            vote: validateVote(resultVote),
            score: updatedPost.voteScore,
        })
    }

    private async findPostById(postId: string) {
        const [result] = await this.database
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1)
        return result ?? null
    }

    private async findExistingVote(postId: string, userId: string) {
        const [result] = await this.database
            .select()
            .from(votes)
            .where(and(eq(votes.postId, postId), eq(votes.userId, userId)))
            .limit(1)
        return result ?? null
    }

    private async updateVote(voteId: string, voteType: VoteType) {
        const [updated] = await this.database
            .update(votes)
            .set({ voteType, updatedAt: new Date().toISOString() })
            .where(eq(votes.id, voteId))
            .returning()
        return updated
    }

    private async createVote(postId: string, userId: string, voteType: VoteType) {
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
        return created
    }

    private async updatePostScore(postId: string, newScore: number) {
        const [updated] = await this.database
            .update(posts)
            .set({ voteScore: newScore, updatedAt: new Date().toISOString() })
            .where(eq(posts.id, postId))
            .returning()
        return updated
    }
}
