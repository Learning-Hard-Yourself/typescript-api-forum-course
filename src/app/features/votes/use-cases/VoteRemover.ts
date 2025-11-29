import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { calculateVoteDelta } from '@/app/features/votes/models/Vote'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { VoteRepository } from '../repositories/VoteRepository'

export interface VoteRemoverInput {
    postId: string
    userId: string
}

export interface VoteRemoverResult {
    removed: boolean
    score: number
}

export class VoteRemover {
    public constructor(
        private readonly voteRepository: VoteRepository,
        private readonly postRepository: PostRepository,
    ) {}

    public async execute(input: VoteRemoverInput): Promise<VoteRemoverResult> {
        const { postId, userId } = input

        const post = await this.postRepository.findById(postId)

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        const existingVote = await this.voteRepository.findByPostAndUser(postId, userId)

        if (!existingVote) {
            return { removed: false, score: post.voteScore }
        }

        const delta = calculateVoteDelta(existingVote, null)

        await this.voteRepository.delete(existingVote.id)

        const updatedPost = await this.postRepository.update(postId, {
            voteScore: post.voteScore + delta,
        })

        return {
            removed: true,
            score: updatedPost.voteScore,
        }
    }
}
