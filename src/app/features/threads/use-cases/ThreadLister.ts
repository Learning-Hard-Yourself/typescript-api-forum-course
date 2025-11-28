import { and, asc, count, desc, eq, like } from 'drizzle-orm'

import type { ThreadListParams, ThreadSortBy } from '@/app/features/threads/models/ThreadListing'
import type { PaginatedResponse } from '@/app/shared/types/Pagination'
import { calculatePaginationMeta } from '@/app/shared/types/Pagination'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export class ThreadLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(params: ThreadListParams): Promise<PaginatedResponse<Thread>> {
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
}
