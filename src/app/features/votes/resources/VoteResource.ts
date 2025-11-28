import type { Vote, VoteScore, VoteType } from '@/app/features/votes/models/Vote'
import { JsonResource, jsonCollection } from '@/app/shared/resources/JsonResource'

export interface VoteOutput {
    id: string
    postId: string
    userId: string
    voteType: VoteType
    createdAt: string
}

export class VoteResource extends JsonResource<Vote, VoteOutput> {
    toArray(): VoteOutput {
        return {
            id: this.resource.id,
            postId: this.resource.postId,
            userId: this.resource.userId,
            voteType: this.resource.voteType,
            createdAt: this.resource.createdAt,
        }
    }

    static scoreToJson(score: VoteScore): { data: VoteScore } {
        return { data: score }
    }

    static fromArray(votes: Vote[]) {
        return jsonCollection(votes.map((vote) => new VoteResource(vote).toArray()))
    }
}
