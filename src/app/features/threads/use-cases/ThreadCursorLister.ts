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
import { threads } from '@/config/schema'
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

    public async execute(
        params: ThreadCursorListParams,
    ): Promise<CursorPaginatedResponse<Thread>> {
        const {
            after,
            before,
            first,
            last,
            sortBy = 'newest',
            categoryId,
            authorId,
            isPinned,
            search,
        } = params

        const isBackward = !!before || !!last
        const limit = Math.min(
            first ?? last ?? DEFAULT_CURSOR_PAGINATION.first,
            DEFAULT_CURSOR_PAGINATION.maxFirst,
        )

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

        const cursorString = isBackward ? before : after
        if (cursorString) {
            const decoded = decodeCursor(cursorString)
            if (decoded) {
                const cursorCondition = isBackward
                    ? gt(threads.createdAt, decoded.timestamp)
                    : lt(threads.createdAt, decoded.timestamp)
                conditions.push(cursorCondition)
            }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        const orderColumn = this.getSortColumn(sortBy)
        const orderDirection = isBackward ? asc : desc

        let query = this.database.select().from(threads)

        if (whereClause) {
            query = query.where(whereClause)
        }

        const results = await query
            .orderBy(orderDirection(orderColumn))
            .limit(limit + 1)

        const hasMore = results.length > limit
        if (hasMore) {
            results.pop()
        }

        if (isBackward) {
            results.reverse()
        }

        const items = results as Thread[]
        const edges = createEdges(items)

        const hasNextPage = isBackward ? !!before : hasMore
        const hasPreviousPage = isBackward ? hasMore : !!after

        const pageInfo = buildPageInfo(edges, hasNextPage, hasPreviousPage)

        return {
            edges,
            pageInfo,
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
}
