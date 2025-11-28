import { MAX_DEPTH } from '@/app/features/posts/models/PostTree'
import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import type { ThreadRepository } from '@/app/features/threads/repositories/ThreadRepository'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Post } from '@/types'

export interface PostReplierInput {
    authorId: string
    parentPostId: string
    content: string
}

export class PostReplier {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly threadRepository: ThreadRepository,
    ) {}

    public async execute(input: PostReplierInput): Promise<Post> {
        const { authorId, parentPostId, content } = input

        const parentPost = await this.postRepository.findById(parentPostId)

        if (!parentPost) {
            throw new NotFoundError(`Post with ID ${parentPostId} not found`)
        }

        const depth = await this.getPostDepth(parentPostId)
        if (depth >= MAX_DEPTH) {
            throw new Error(`Maximum reply depth (${MAX_DEPTH}) reached`)
        }

        const timestamp = new Date().toISOString()

        const post = await this.postRepository.save({
            threadId: parentPost.threadId,
            authorId,
            parentPostId,
            content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        await this.threadRepository.updateLastPost(parentPost.threadId, post.id)

        return post
    }

    private async getPostDepth(postId: string): Promise<number> {
        let depth = 0
        let currentPostId: string | null = postId

        while (currentPostId && depth < MAX_DEPTH + 1) {
            const post = await this.postRepository.findById(currentPostId)

            if (!post || post.parentPostId === null) {
                break
            }

            depth++
            currentPostId = post.parentPostId
        }

        return depth
    }
}
