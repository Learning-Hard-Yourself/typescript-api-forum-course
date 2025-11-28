import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { posts } from '@/config/schema'
import type { Post } from '@/types'
import type { PostRepository } from './PostRepository'

/**
 * Drizzle ORM implementation of PostRepository
 */
export class DrizzlePostRepository implements PostRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Post | null> {
        const [post] = await this.database
            .select()
            .from(posts)
            .where(eq(posts.id, id))
            .limit(1)

        return (post as Post) ?? null
    }

    async findByThreadId(threadId: string): Promise<Post[]> {
        const result = await this.database
            .select()
            .from(posts)
            .where(eq(posts.threadId, threadId))

        return result as Post[]
    }

    async save(post: Omit<Post, 'id'>): Promise<Post> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(posts)
            .values({
                id: uuidv7(),
                ...post,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as Post
    }

    async update(id: string, data: Partial<Post>): Promise<Post> {
        const [updated] = await this.database
            .update(posts)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(posts.id, id))
            .returning()

        return updated as Post
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(posts).where(eq(posts.id, id))
    }
}
