import { and, asc, count, desc, eq, like } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ThreadListParams, ThreadSortBy } from '@/app/features/threads/models/ThreadListing'
import {
    type ThreadUpdatePayload,
    type UserRole,
    assertCanUpdate,
    assertIsAdminOrModerator,
    filterUpdateByRole,
} from '@/app/features/threads/models/ThreadUpdate'
import type { ThreadCreationAttributes } from '@/app/features/threads/requests/ThreadCreationRequest'
import { NotFoundError } from '@/app/shared/errors'
import type { PaginatedResponse } from '@/app/shared/types/Pagination'
import { calculatePaginationMeta } from '@/app/shared/types/Pagination'
import type { ForumDatabase } from '@/config/database-types'
import { posts, threads } from '@/config/schema'
import type { Thread } from '@/types'

export class ThreadService {
    public constructor(private readonly database: ForumDatabase) { }

    public async create(authorId: string, attributes: ThreadCreationAttributes): Promise<Thread> {
        const threadId = uuidv7()
        const postId = uuidv7()
        const timestamp = new Date().toISOString()

        this.database.transaction((tx: any) => {

            tx.insert(threads).values({
                id: threadId,
                categoryId: attributes.categoryId,
                authorId,
                title: attributes.title,
                slug: attributes.slug ?? this.generateSlug(attributes.title),
                isPinned: false,
                isLocked: false,
                viewCount: 0,
                replyCount: 0,
                lastPostId: null,
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            tx.insert(posts).values({
                id: postId,
                threadId,
                parentPostId: null,
                authorId,
                content: attributes.content,
                voteScore: 0,
                isEdited: false,
                isDeleted: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            tx.update(threads).set({ lastPostId: postId }).where(eq(threads.id, threadId)).run()
        })

        const [record] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.id, threadId))
            .limit(1)

        if (!record) {
            throw new Error('Thread could not be created')
        }

        return record as Thread
    }


    public async updateThread(
        threadId: string,
        userId: string,
        userRole: UserRole,
        updateData: ThreadUpdatePayload,
    ): Promise<Thread> {

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const isAuthor = thread.authorId === userId
        assertCanUpdate(userRole, updateData, isAuthor)

        const allowedUpdate = filterUpdateByRole(userRole, updateData)

        const [updatedThread] = await this.database
            .update(threads)
            .set({
                ...allowedUpdate,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread')
        }

        return updatedThread as Thread
    }


    public async pinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: true })
    }


    public async unpinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: false })
    }


    public async lockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: true })
    }


    public async unlockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: false })
    }


    private async updateThreadStatus(
        threadId: string,
        update: Partial<Pick<Thread, 'isPinned' | 'isLocked'>>,
    ): Promise<Thread> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const [updatedThread] = await this.database
            .update(threads)
            .set({
                ...update,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread status')
        }

        return updatedThread as Thread
    }


    public async isThreadLocked(threadId: string): Promise<boolean> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        return thread?.isLocked ?? false
    }


    public async list(params: ThreadListParams): Promise<PaginatedResponse<Thread>> {
        const {
            page = 1,
            perPage = 20,
            sortBy = 'newest',
            sortOrder = 'desc',
            categoryId,
            authorId,
            isPinned,
            search,
        } = params

        const conditions = []
        if (categoryId) {
            conditions.push(eq(threads.categoryId, categoryId))
        }
        if (authorId) {
            conditions.push(eq(threads.authorId, authorId))
        }
        if (isPinned !== undefined) {
            conditions.push(eq(threads.isPinned, isPinned))
        }
        if (search) {
            conditions.push(like(threads.title, `%${search}%`))
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        const countQuery = this.database
            .select({ count: count() })
            .from(threads)

        if (whereClause) {
            countQuery.where(whereClause)
        }

        const totalResult = await countQuery
        const total = totalResult[0]?.count ?? 0

        let query = this.database.select().from(threads)

        if (whereClause) {
            query = query.where(whereClause)
        }

        const orderColumn = this.getSortColumn(sortBy)
        query = sortOrder === 'asc' ? query.orderBy(asc(orderColumn)) : query.orderBy(desc(orderColumn))

        const offset = (page - 1) * perPage
        const results = await query.limit(perPage).offset(offset)

        const { meta, links } = calculatePaginationMeta(page, perPage, total, '/api/threads')

        return {
            data: results as Thread[],
            links,
            meta,
        }
    }


    private getSortColumn(sortBy: ThreadSortBy) {
        switch (sortBy) {
            case 'newest':
                return threads.createdAt
            case 'popular':
                return threads.viewCount
            case 'most_active':
                return threads.updatedAt

        }
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
