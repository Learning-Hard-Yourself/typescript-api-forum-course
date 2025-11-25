import type { Vote, VoteScore } from '@/app/features/votes/models/Vote'

/**
 * Vote Resource - Transform database models for API responses
 *
 * Demonstrates: Utility Types (Pick, Omit), Type transformations
 */
export class VoteResource {
    /**
     * Transform a single vote for API response
     * Demonstrates: Pick utility type to select specific fields
     */
    public toJson(vote: Vote): Pick<Vote, 'id' | 'postId' | 'userId' | 'voteType' | 'createdAt'> {
        return {
            id: vote.id,
            postId: vote.postId,
            userId: vote.userId,
            voteType: vote.voteType,
            createdAt: vote.createdAt,
        }
    }

    /**
     * Transform vote score for API response
     */
    public scoreToJson(score: VoteScore): VoteScore {
        return {
            upvotes: score.upvotes,
            downvotes: score.downvotes,
            score: score.score,
        }
    }

    /**
     * Transform array of votes
     * Demonstrates: Generic array transformation
     */
    public toJsonArray(votes: Vote[]): ReturnType<typeof this.toJson>[] {
        return votes.map((vote) => this.toJson(vote))
    }
}
