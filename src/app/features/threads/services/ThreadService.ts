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

        // Transaction to ensure thread and initial post are created together
        this.database.transaction((tx: any) => {
            // 1. Create Thread (initially with null lastPostId to avoid FK violation)
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
                lastPostId: null, // Set to null initially
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            // 2. Create Initial Post
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

            // 3. Update Thread with lastPostId
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

    /**
   * Update thread with role-based permissions
   *
   * Demonstrates:
   * - Type Guards for permission checking
   * - Utility Types in practice
   * - Runtime validation with TypeScript
   *
   * @param threadId - ID of thread to update
   * @param userId - ID of user making the update
   * @param userRole - Role of user (user, moderator, admin)
   * @param updateData - Fields to update
   * @returns Updated thread
   * @throws NotFoundError if thread doesn't exist
   * @throws ForbiddenError if user lacks permissions
   */
    public async updateThread(
        threadId: string,
        userId: string,
        userRole: UserRole,
        updateData: ThreadUpdatePayload,
    ): Promise<Thread> {
        // Find thread
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        // Check permissions
        const isAuthor = thread.authorId === userId
        assertCanUpdate(userRole, updateData, isAuthor)

        // Filter updates based on role
        const allowedUpdate = filterUpdateByRole(userRole, updateData)

        // Perform update
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

    /**
     * Pin a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to pin
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async pinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: true })
    }

    /**
     * Unpin a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to unpin
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async unpinThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isPinned: false })
    }

    /**
     * Lock a thread to prevent new replies (admin/moderator only)
     *
     * @param threadId - ID of thread to lock
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async lockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: true })
    }

    /**
     * Unlock a thread (admin/moderator only)
     *
     * @param threadId - ID of thread to unlock
     * @param userRole - Role of user making the request
     * @returns Updated thread
     * @throws ForbiddenError if user is not admin/moderator
     */
    public async unlockThread(threadId: string, userRole: UserRole): Promise<Thread> {
        assertIsAdminOrModerator(userRole)

        return this.updateThreadStatus(threadId, { isLocked: false })
    }

    /**
     * Internal method to update thread status fields
     *
     * @param threadId - ID of thread to update
     * @param update - Status fields to update
     * @returns Updated thread
     * @throws NotFoundError if thread doesn't exist
     */
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

    /**
     * Check if thread is locked
     *
     * @param threadId - ID of thread to check
     * @returns true if thread is locked
     */
    public async isThreadLocked(threadId: string): Promise<boolean> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        return thread?.isLocked ?? false
    }

    /**
     * List threads with pagination, sorting, and filtering
     *
     * Demonstrates:
     * - Generic types in action (PaginatedResponse<Thread>)
     * - Complex query building with type safety
     * - Type narrowing for sort options
     *
     * @param params - Listing parameters (page, perPage, sort, filters)
     * @returns Paginated thread response
     */
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

        // Build WHERE conditions
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

        // Apply filters to query
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        // Get total count
        const countQuery = this.database
            .select({ count: count() })
            .from(threads)

        if (whereClause) {
            countQuery.where(whereClause)
        }

        const totalResult = await countQuery
        const total = totalResult[0]?.count ?? 0

        // Build main query
        let query = this.database.select().from(threads)

        if (whereClause) {
            query = query.where(whereClause)
        }

        // Apply sorting - demonstrates type narrowing!
        const orderColumn = this.getSortColumn(sortBy)
        query = sortOrder === 'asc' ? query.orderBy(asc(orderColumn)) : query.orderBy(desc(orderColumn))

        // Apply pagination
        const offset = (page - 1) * perPage
        const results = await query.limit(perPage).offset(offset)

        // Build paginated response
        const { meta, links } = calculatePaginationMeta(page, perPage, total, '/api/threads')

        return {
            data: results as Thread[],
            links,
            meta,
        }
    }

    /**
     * Get sort column based on sort option
     *
     * Demonstrates: TypeScript's exhaustiveness checking with switch
     * If we add a new ThreadSortBy option and forget to handle it,
     * TypeScript will error!
     *
     * @param sortBy - Sort option
     * @returns Database column for sorting
     */
    private getSortColumn(sortBy: ThreadSortBy) {
        switch (sortBy) {
            case 'newest':
                return threads.createdAt
            case 'popular':
                return threads.viewCount
            case 'most_active':
                return threads.updatedAt
            // If we add a new sort option and forget this case,
            // TypeScript will error because the switch isn't exhaustive!
        }
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
