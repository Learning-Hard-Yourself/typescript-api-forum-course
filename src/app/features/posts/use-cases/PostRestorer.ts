import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { NotFoundError } from '@/app/shared/errors'
import type { Post } from '@/types'

export interface PostRestorerInput {
    postId: string
    restorerId: string
}

export class PostRestorer {
    public constructor(private readonly postRepository: PostRepository) {}

    public async execute(input: PostRestorerInput): Promise<Post> {
        const { postId } = input

        const post = await this.postRepository.findById(postId)

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        if (!post.isDeleted) {
            throw new Error('Post is not deleted')
        }

        return this.postRepository.update(postId, {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
        })
    }
}
