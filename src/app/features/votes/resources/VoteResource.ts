import type { Vote, VoteScore } from '@/app/features/votes/models/Vote'

export class VoteResource {

    public toJson(vote: Vote): Pick<Vote, 'id' | 'postId' | 'userId' | 'voteType' | 'createdAt'> {
        return {
            id: vote.id,
            postId: vote.postId,
            userId: vote.userId,
            voteType: vote.voteType,
            createdAt: vote.createdAt,
        }
    }


    public scoreToJson(score: VoteScore): VoteScore {
        return {
            upvotes: score.upvotes,
            downvotes: score.downvotes,
            score: score.score,
        }
    }


    public toJsonArray(votes: Vote[]): ReturnType<typeof this.toJson>[] {
        return votes.map((vote) => this.toJson(vote))
    }
}
