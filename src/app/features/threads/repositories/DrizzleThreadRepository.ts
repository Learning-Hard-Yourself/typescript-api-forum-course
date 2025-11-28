import { eq, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'
import type { ThreadRepository } from './ThreadRepository'

/**
 * Drizzle ORM implementation of ThreadRepository
 */
export class DrizzleThreadRepository implements ThreadRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Thread | null> {
        const [thread] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.id, id))
            .limit(1)

        return (thread as Thread) ?? null
    }

    async findBySlug(slug: string): Promise<Thread | null> {
        const [thread] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.slug, slug))
            .limit(1)

        return (thread as Thread) ?? null
    }

    async findByCategoryId(categoryId: string): Promise<Thread[]> {
        const result = await this.database
            .select()
            .from(threads)
            .where(eq(threads.categoryId, categoryId))

        return result as Thread[]
    }

    async findByAuthorId(authorId: string): Promise<Thread[]> {
        const result = await this.database
            .select()
            .from(threads)
            .where(eq(threads.authorId, authorId))

        return result as Thread[]
    }

    async save(thread: Omit<Thread, 'id'>): Promise<Thread> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(threads)
            .values({
                id: uuidv7(),
                ...thread,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as Thread
    }

    async update(id: string, data: Partial<Thread>): Promise<Thread> {
        const [updated] = await this.database
            .update(threads)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(threads.id, id))
            .returning()

        return updated as Thread
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(threads).where(eq(threads.id, id))
    }

    async incrementViewCount(id: string): Promise<void> {
        await this.database
            .update(threads)
            .set({ viewCount: sql`${threads.viewCount} + 1` })
            .where(eq(threads.id, id))
    }

    async updateLastPost(id: string, lastPostId: string): Promise<void> {
        await this.database
            .update(threads)
            .set({
                lastPostId,
                replyCount: sql`${threads.replyCount} + 1`,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, id))
    }
}
