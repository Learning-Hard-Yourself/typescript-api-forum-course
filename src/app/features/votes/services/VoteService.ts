/**
 * Vote Service - Business logic for voting
 *
 * Demonstrates:
 * - Async/await with proper typing
 * - Error handling with custom errors
 * - Database transactions
 * - Type inference from database queries
 */

import { and, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { Vote, VoteScore, VoteType } from '@/app/features/votes/models/Vote'
import { calculateVoteDelta, calculateVoteScore, validateVote } from '@/app/features/votes/models/Vote'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, votes } from '@/config/schema'

export class VoteService {
    public constructor(private readonly database: ForumDatabase) { }

    /**
     * Cast or update a vote on a post
     * Returns: The vote and the new post score
     */
    public async castVote(postId: string, userId: string, voteType: VoteType): Promise<{ vote: Vote; score: number }> {
        // Check if post exists
        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        // Check if user already voted
        const existingVote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        // Calculate vote delta for post score update
        const delta = calculateVoteDelta(existingVote, voteType)

        let resultVote: Vote

        if (existingVote) {
            // Update existing vote
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
            // Create new vote
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

        // Update post vote score
        const [updatedPost] = await this.database
            .update(posts)
            .set({
                voteScore: post.voteScore + delta,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(posts.id, postId))
            .returning()

        // Validate the vote before returning
        const validatedVote = validateVote(resultVote)

        return {
            vote: validatedVote,
            score: updatedPost.voteScore,
        }
    }

    /**
     * Remove a user's vote from a post
     */
    public async removeVote(postId: string, userId: string): Promise<{ removed: boolean; score: number }> {
        // Check if post exists
        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        // Find the vote
        const existingVote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        if (!existingVote) {
            return { removed: false, score: post.voteScore }
        }

        // Calculate delta
        const delta = calculateVoteDelta(existingVote, null)

        // Delete vote
        await this.database.delete(votes).where(eq(votes.id, existingVote.id))

        // Update post score
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

    /**
     * Get vote score for a post
     */
    public async getVoteScore(postId: string): Promise<VoteScore> {
        const postVotes = await this.database.query.votes.findMany({
            where: eq(votes.postId, postId),
        })

        return calculateVoteScore(postVotes)
    }

    /**
     * Get user's vote on a specific post
     */
    public async getUserVote(postId: string, userId: string): Promise<Vote | null> {
        const vote = await this.database.query.votes.findFirst({
            where: and(eq(votes.postId, postId), eq(votes.userId, userId)),
        })

        return vote ?? null
    }
}
