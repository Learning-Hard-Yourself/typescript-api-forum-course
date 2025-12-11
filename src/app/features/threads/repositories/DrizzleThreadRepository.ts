import { eq, sql } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { categories, posts, threads, users } from '@/config/schema'
import type { Thread } from '@/types'
import type { ThreadCreationData, ThreadRepository } from './ThreadRepository'


export class DrizzleThreadRepository implements ThreadRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Thread | null> {
        const [row] = await this.database
            .select({
                thread: threads,
                author: users,
                category: categories,
            })
            .from(threads)
            .leftJoin(users, eq(users.id, threads.authorId))
            .leftJoin(categories, eq(categories.id, threads.categoryId))
            .where(eq(threads.id, id))
            .limit(1)

        if (!row) return null

        return {
            ...row.thread,
            author: row.author ?? undefined,
            category: row.category ?? undefined,
        } as Thread
    }

    async findBySlug(slug: string): Promise<Thread | null> {
        const [row] = await this.database
            .select({
                thread: threads,
                author: users,
                category: categories,
            })
            .from(threads)
            .leftJoin(users, eq(users.id, threads.authorId))
            .leftJoin(categories, eq(categories.id, threads.categoryId))
            .where(eq(threads.slug, slug))
            .limit(1)

        if (!row) return null

        return {
            ...row.thread,
            author: row.author ?? undefined,
            category: row.category ?? undefined,
        } as Thread
    }

    async findByCategoryId(categoryId: string): Promise<Thread[]> {
        const rows = await this.database
            .select({
                thread: threads,
                author: users,
                category: categories,
            })
            .from(threads)
            .leftJoin(users, eq(users.id, threads.authorId))
            .leftJoin(categories, eq(categories.id, threads.categoryId))
            .where(eq(threads.categoryId, categoryId))

        type Row = {
            thread: typeof threads.$inferSelect
            author: typeof users.$inferSelect | null
            category: typeof categories.$inferSelect | null
        }

        return (rows as Row[]).map((row) => ({
            ...row.thread,
            author: row.author ?? undefined,
            category: row.category ?? undefined,
        })) as Thread[]
    }

    async findByAuthorId(authorId: string): Promise<Thread[]> {
        const rows = await this.database
            .select({
                thread: threads,
                author: users,
                category: categories,
            })
            .from(threads)
            .leftJoin(users, eq(users.id, threads.authorId))
            .leftJoin(categories, eq(categories.id, threads.categoryId))
            .where(eq(threads.authorId, authorId))

        type Row = {
            thread: typeof threads.$inferSelect
            author: typeof users.$inferSelect | null
            category: typeof categories.$inferSelect | null
        }

        return (rows as Row[]).map((row) => ({
            ...row.thread,
            author: row.author ?? undefined,
            category: row.category ?? undefined,
        })) as Thread[]
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

    async saveWithInitialPost(data: ThreadCreationData): Promise<Thread> {
        const threadId = uuidv7()
        const postId = uuidv7()
        const timestamp = new Date().toISOString()

        const slug = this.generateSlug(data.title, data.slug)

        // Insert thread
        await this.database.insert(threads).values({
            id: threadId,
            categoryId: data.categoryId,
            authorId: data.authorId,
            title: data.title,
            slug,
            isPinned: false,
            isLocked: false,
            viewCount: 0,
            replyCount: 0,
            lastPostId: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        // Insert initial post
        await this.database.insert(posts).values({
            id: postId,
            threadId,
            parentPostId: null,
            authorId: data.authorId,
            content: data.content,
            voteScore: 0,
            isEdited: false,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        // Update thread with last post
        await this.database
            .update(threads)
            .set({ lastPostId: postId })
            .where(eq(threads.id, threadId))

        const thread = await this.findById(threadId)

        if (!thread) {
            throw new Error('Thread could not be created')
        }

        return thread
    }

    private generateSlug(title: string, providedSlug?: string): string {
        if (providedSlug) return providedSlug

        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
