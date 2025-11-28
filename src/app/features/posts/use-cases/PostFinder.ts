import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Post } from '@/types'

export interface PostFinderInput {
    id: string
}

export class PostFinder {
    public constructor(private readonly postRepository: PostRepository) {}

    public async execute(input: PostFinderInput): Promise<Post> {
        const post = await this.postRepository.findById(input.id)

        if (!post) {
            throw new NotFoundError(`Post with ID ${input.id} not found`)
        }

        return post
    }
}
