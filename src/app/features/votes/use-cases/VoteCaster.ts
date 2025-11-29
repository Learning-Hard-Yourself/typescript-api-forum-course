import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import type { Vote, VoteType } from '@/app/features/votes/models/Vote'
import { calculateVoteDelta, validateVote } from '@/app/features/votes/models/Vote'
import type { Result } from '@/app/shared/types/Result'
import { err, ok } from '@/app/shared/types/Result'
import type { VoteRepository } from '../repositories/VoteRepository'

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
    public constructor(
        private readonly voteRepository: VoteRepository,
        private readonly postRepository: PostRepository,
    ) {}

    public async execute(input: VoteCasterInput): Promise<Result<VoteCasterOutput, VoteCasterError>> {
        const { postId, userId, voteType } = input

        const post = await this.postRepository.findById(postId)
        if (!post) {
            return err({ code: 'POST_NOT_FOUND', postId })
        }

        const existingVote = await this.voteRepository.findByPostAndUser(postId, userId)
        const delta = calculateVoteDelta(existingVote ?? undefined, voteType)

        const resultVote = existingVote
            ? await this.voteRepository.update(existingVote.id, voteType)
            : await this.voteRepository.save({
                  postId,
                  userId,
                  voteType,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
              })

        const updatedPost = await this.postRepository.update(postId, {
            voteScore: post.voteScore + delta,
        })

        return ok({
            vote: validateVote(resultVote),
            score: updatedPost.voteScore,
        })
    }
}
