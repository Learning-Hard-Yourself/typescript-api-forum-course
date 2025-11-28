import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import type { PostCreationAttributes } from '@/app/features/posts/requests/PostCreationRequest'
import type { ThreadRepository } from '@/app/features/threads/repositories/ThreadRepository'
import type { Post } from '@/types'

export interface PostCreatorInput {
    authorId: string
    attributes: PostCreationAttributes
}

export class PostCreator {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly threadRepository: ThreadRepository,
    ) {}

    public async execute(input: PostCreatorInput): Promise<Post> {
        const { authorId, attributes } = input

        const post = await this.postRepository.save({
            threadId: attributes.threadId,
            parentPostId: attributes.parentPostId ?? null,
            authorId,
            content: attributes.content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        await this.threadRepository.updateLastPost(attributes.threadId, post.id)

        return post
    }
}
