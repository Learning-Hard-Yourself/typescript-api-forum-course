import type { PostEditRepository } from '@/app/features/posts/repositories/PostEditRepository'
import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { NotFoundError } from '@/app/shared/errors'
import type { Post } from '@/types'

export interface PostEditorInput {
    postId: string
    editorId: string
    newContent: string
    reason?: string
}

export class PostEditor {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly postEditRepository: PostEditRepository,
    ) {}

    public async execute(input: PostEditorInput): Promise<Post> {
        const { postId, editorId, newContent, reason } = input

        const post = await this.postRepository.findById(postId)

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        if (post.authorId !== editorId) {
            console.warn(`User ${editorId} editing post not authored by them`)
        }

        await this.postEditRepository.save({
            postId,
            editorId,
            previousContent: post.content,
            newContent,
            editReason: reason ?? null,
            createdAt: new Date().toISOString(),
        })

        return this.postRepository.update(postId, {
            content: newContent,
            isEdited: true,
        })
    }
}
