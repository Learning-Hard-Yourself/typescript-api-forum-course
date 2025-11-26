

import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Vote, VoteScore, VoteType } from '@/app/features/votes/models/Vote'
import { calculateVoteDelta, calculateVoteScore, validateVote } from '@/app/features/votes/models/Vote'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, votes } from '@/config/schema'

export class VoteService {
    public constructor(private readonly database: ForumDatabase) { }


    public async castVote(postId: string, userId: string, voteType: VoteType): Promise<{ vote: Vote; score: number }> {
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


    public async removeVote(postId: string, userId: string): Promise<{ removed: boolean; score: number }> {

        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        const existingVote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        if (!existingVote) {
            return { removed: false, score: post.voteScore }
        }

        const delta = calculateVoteDelta(existingVote, null)

        await this.database.delete(votes).where(eq(votes.id, existingVote.id))

        const [updatedPost] = await this.database
            .update(posts)
            .set({
                voteScore: post.voteScore + delta,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
            .returning()

        return {
            removed: true,
            score: updatedPost.voteScore,
        }
    }


    public async getVoteScore(postId: string): Promise<VoteScore> {
        const postVotes = await this.database.query.votes.findMany({
            where: eq(votes.postId, postId),
        })

        return calculateVoteScore(postVotes)
    }


    public async getUserVote(postId: string, userId: string): Promise<Vote | null> {
        const vote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        return vote ?? null
    }
}
