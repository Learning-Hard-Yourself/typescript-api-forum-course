import type { PostWithReplies } from '@/app/features/posts/models/PostTree'
import { buildPostTree } from '@/app/features/posts/models/PostTree'
import type { PostRepository } from '@/app/features/posts/repositories/PostRepository'
import type { ThreadRepository } from '@/app/features/threads/repositories/ThreadRepository'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'

export interface ThreadPostsListerInput {
    threadId: string
}

export class ThreadPostsLister {
    public constructor(
        private readonly postRepository: PostRepository,
        private readonly threadRepository: ThreadRepository,
    ) {}

    public async execute(input: ThreadPostsListerInput): Promise<PostWithReplies[]> {
        const { threadId } = input

        const thread = await this.threadRepository.findById(threadId)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const allPosts = await this.postRepository.findByThreadId(threadId)

        return buildPostTree(allPosts)
    }
}
