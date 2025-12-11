import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gt, like, lt } from 'drizzle-orm'

import type { ThreadSortBy } from '@/app/features/threads/models/ThreadListing'
import type {
    CursorPaginatedResponse,
    CursorPaginationParams,
} from '@/app/shared/types/CursorPagination'
import {
    buildPageInfo,
    createEdges,
    decodeCursor,
    DEFAULT_CURSOR_PAGINATION,
} from '@/app/shared/types/CursorPagination'
import type { ForumDatabase } from '@/config/database-types'
import { categories, threads, users } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadCursorListParams extends CursorPaginationParams {
    sortBy?: ThreadSortBy
    categoryId?: string
    authorId?: string
    isPinned?: boolean
    search?: string
}

export class ThreadCursorLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(params: ThreadCursorListParams): Promise<CursorPaginatedResponse<Thread>> {
        const { sortBy = 'newest' } = params
        const isBackward = this.isBackwardPagination(params)
        const limit = this.calculateLimit(params)
        const conditions = this.buildConditions(params, isBackward)
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        const results = await this.fetchThreads(whereClause, sortBy, isBackward, limit)
        const hasMore = results.length > limit

        if (hasMore) results.pop()
        if (isBackward) results.reverse()

        return this.buildResponse(results, params, isBackward, hasMore)
    }

    private isBackwardPagination(params: ThreadCursorListParams): boolean {
        return !!params.before || !!params.last
    }

    private calculateLimit(params: ThreadCursorListParams): number {
        const { first, last } = params
        return Math.min(
            first ?? last ?? DEFAULT_CURSOR_PAGINATION.first,
            DEFAULT_CURSOR_PAGINATION.maxFirst,
        )
    }

    private buildConditions(params: ThreadCursorListParams, isBackward: boolean): SQL[] {
        const { categoryId, authorId, isPinned, search, before, after } = params
        const conditions: SQL[] = []

        if (categoryId) conditions.push(eq(threads.categoryId, categoryId))
        if (authorId) conditions.push(eq(threads.authorId, authorId))
        if (isPinned !== undefined) conditions.push(eq(threads.isPinned, isPinned))
        if (search) conditions.push(like(threads.title, `%${search}%`))

        const cursorCondition = this.buildCursorCondition(isBackward ? before : after, isBackward)
        if (cursorCondition) conditions.push(cursorCondition)

        return conditions
    }

    private buildCursorCondition(cursorString: string | undefined, isBackward: boolean): SQL | null {
        if (!cursorString) return null

        const decoded = decodeCursor(cursorString)
        if (!decoded) return null

        return isBackward
            ? gt(threads.createdAt, decoded.timestamp)
            : lt(threads.createdAt, decoded.timestamp)
    }

    private async fetchThreads(
        whereClause: SQL | undefined,
        sortBy: ThreadSortBy,
        isBackward: boolean,
        limit: number,
    ): Promise<Thread[]> {
        const orderColumn = this.getSortColumn(sortBy)
        const orderDirection = isBackward ? asc : desc

        let query = this.database
            .select({
                thread: threads,
                author: users,
                category: categories,
            })
            .from(threads)
            .leftJoin(users, eq(users.id, threads.authorId))
            .leftJoin(categories, eq(categories.id, threads.categoryId))

        if (whereClause) query = query.where(whereClause)

        const rows = await query.orderBy(orderDirection(orderColumn)).limit(limit + 1)

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

    private buildResponse(
        items: Thread[],
        params: ThreadCursorListParams,
        isBackward: boolean,
        hasMore: boolean,
    ): CursorPaginatedResponse<Thread> {
        const edges = createEdges(items)
        const hasNextPage = isBackward ? !!params.before : hasMore
        const hasPreviousPage = isBackward ? hasMore : !!params.after

        return {
            edges,
            pageInfo: buildPageInfo(edges, hasNextPage, hasPreviousPage),
        }
    }

    private getSortColumn(sortBy: ThreadSortBy) {
        const columns = {
            newest: threads.createdAt,
            popular: threads.viewCount,
            most_active: threads.updatedAt,
        }
        return columns[sortBy]
    }
}
