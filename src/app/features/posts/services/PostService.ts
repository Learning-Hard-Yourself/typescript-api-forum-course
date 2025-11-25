import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { PostWithReplies } from '@/app/features/posts/models/PostTree'
import { buildPostTree, MAX_DEPTH } from '@/app/features/posts/models/PostTree'
import type { PostCreationAttributes } from '@/app/features/posts/requests/PostCreationRequest'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Post } from '@/types'

export class PostService {
    public constructor(private readonly database: ForumDatabase) { }

    /**
     * Create a new post in a thread (top-level post)
     */
    public async create(authorId: string, attributes: PostCreationAttributes): Promise<Post> {
        const id = uuidv7()
        const timestamp = new Date().toISOString()

        // Create post
        await this.database.insert(posts).values({
            id,
            threadId: attributes.threadId,
            parentPostId: attributes.parentPostId ?? null,
            authorId,
            content: attributes.content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        // Update thread stats
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, attributes.threadId),
        })

        if (thread) {
            await this.database
                .update(threads)
                .set({
                    lastPostId: id,
                    replyCount: thread.replyCount + 1,
                    updatedAt: timestamp,
                })
                .where(eq(threads.id, attributes.threadId))
        }

        const [record] = await this.database.select().from(posts).where(eq(posts.id, id)).limit(1)

        if (!record) {
            throw new Error('Post could not be created')
        }

        return record as Post
    }

    /**
     * Create a reply to an existing post
     * Demonstrates: Depth validation and hierarchical structures
     */
    public async createReply(parentPostId: string, authorId: string, content: string): Promise<Post> {
        // Verify parent post exists
        const parentPost = await this.database.query.posts.findFirst({
            where: eq(posts.id, parentPostId),
        })

        if (!parentPost) {
            throw new NotFoundError(`Post with ID ${parentPostId} not found`)
        }

        // Check depth limit by counting ancestors
        const depth = await this.getPostDepth(parentPostId)
        if (depth >= MAX_DEPTH) {
            throw new Error(`Maximum reply depth (${MAX_DEPTH}) reached`)
        }

        const id = uuidv7()
        const timestamp = new Date().toISOString()

        // Create reply
        await this.database.insert(posts).values({
            id,
            threadId: parentPost.threadId,
            authorId,
            parentPostId,
            content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        // Update thread's reply count and last post
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, parentPost.threadId),
        })

        if (thread) {
            await this.database
                .update(threads)
                .set({
                    replyCount: thread.replyCount + 1,
                    lastPostId: id,
                    updatedAt: timestamp,
                })
                .where(eq(threads.id, parentPost.threadId))
        }

        const [record] = await this.database.select().from(posts).where(eq(posts.id, id)).limit(1)

        if (!record) {
            throw new Error('Reply could not be created')
        }

        return record as Post
    }

    /**
     * Get all posts in a thread with nested structure
     * Demonstrates: Tree building from flat data
     */
    public async getThreadPosts(threadId: string): Promise<PostWithReplies[]> {
        // Verify thread exists
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        // Get all posts in the thread
        const allPosts = await this.database.query.posts.findMany({
            where: eq(posts.threadId, threadId),
            orderBy: (posts, { asc }) => [asc(posts.createdAt)],
        })

        // Build tree structure
        const postsAsPost: Post[] = allPosts as Post[]
        return buildPostTree(postsAsPost)
    }

    /**
     * Calculate depth of a post by counting ancestors
     */
    private async getPostDepth(postId: string): Promise<number> {
        let depth = 0
        let currentPostId: string | null = postId

        while (currentPostId && depth < MAX_DEPTH + 1) {
            const post = await this.database.query.posts.findFirst({
                where: eq(posts.id, currentPostId),
            })

            if (!post || post.parentPostId === null) {
                break
            }

            depth++
            currentPostId = post.parentPostId
        }

        return depth
    }
}
