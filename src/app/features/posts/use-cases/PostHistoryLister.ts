import type { EditHistoryEntry, PostEdit } from '@/app/features/posts/models/PostModeration'
import { createEditHistoryEntry } from '@/app/features/posts/models/PostModeration'
import type { PostEditRepository } from '@/app/features/posts/repositories/PostEditRepository'
import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import { NotFoundError } from '@/app/shared/errors'

export interface PostHistoryListerInput {
    postId: string
}

export class PostHistoryLister {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly postEditRepository: PostEditRepository,
    ) {}

    public async execute(input: PostHistoryListerInput): Promise<EditHistoryEntry[]> {
        const { postId } = input

        const post = await this.postRepository.findById(postId)

        if (!post) {
            throw new NotFoundError(`Post with ID ${postId} not found`)
        }

        const edits = await this.postEditRepository.findByPostId(postId)

        return edits.map((edit) => createEditHistoryEntry(edit as PostEdit))
    }
}
