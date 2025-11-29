import type { Vote, VoteScore } from '@/app/features/votes/models/Vote'
import { calculateVoteScore } from '@/app/features/votes/models/Vote'
import type { VoteRepository } from '../repositories/VoteRepository'

export interface VoteScoreRetrieverInput {
    postId: string
}

export interface UserVoteRetrieverInput {
    postId: string
    userId: string
}

export class VoteRetriever {
    public constructor(private readonly voteRepository: VoteRepository) {}

    public async getVoteScore(input: VoteScoreRetrieverInput): Promise<VoteScore> {
        const postVotes = await this.voteRepository.findByPostId(input.postId)

        return calculateVoteScore(postVotes)
    }

    public async getUserVote(input: UserVoteRetrieverInput): Promise<Vote | null> {
        return this.voteRepository.findByPostAndUser(input.postId, input.userId)
    }
}
