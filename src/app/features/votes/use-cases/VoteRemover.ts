import { and, eq } from 'drizzle-orm'

import { calculateVoteDelta } from '@/app/features/votes/models/Vote'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, votes } from '@/config/schema'

export interface VoteRemoverInput {
    postId: string
    userId: string
}

export interface VoteRemoverResult {
    removed: boolean
    score: number
}

export class VoteRemover {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: VoteRemoverInput): Promise<VoteRemoverResult> {
        const { postId, userId } = input

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
}
