import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { NotFoundError } from '@/app/shared/errors'

export interface PostDeleterInput {
    postId: string
    deleterId: string
    reason?: string
}

export class PostDeleter {
    public constructor(private readonly postRepository: PostRepository) {}

    public async execute(input: PostDeleterInput): Promise<void> {
        const { postId, deleterId } = input

        const post = await this.postRepository.findById(postId)

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        if (post.isDeleted) {
            throw new Error('Post is already deleted')
        }

        await this.postRepository.update(postId, {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: deleterId,
        })
    }
}
