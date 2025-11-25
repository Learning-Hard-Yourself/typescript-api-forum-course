

export interface PaginatedResponse<T> {
    data: T[]
    links: PaginationLinks
    meta: PaginationMeta
}

export interface PaginationLinks {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
}

export interface PaginationMeta {
    currentPage: number
    from: number
    lastPage: number
    path: string
    perPage: number
    to: number
    total: number
}

export interface PaginationParams {
    page: number
    perPage: number
}

export const DEFAULT_PAGINATION = {
    page: 1,
    perPage: 20,
    maxPerPage: 100,
} as const

export interface SortParams<TSortBy extends string = string> {
    sortBy: TSortBy
    sortOrder: 'asc' | 'desc'
}

export type SortOrder = 'asc' | 'desc'

export const DEFAULT_SORT_ORDER: SortOrder = 'desc'

export type ListParams<TSortBy extends string = string> = PaginationParams &
    Partial<SortParams<TSortBy>>

export function calculatePaginationMeta(
    page: number,
    perPage: number,
    total: number,
    basePath: string,
): { meta: PaginationMeta; links: PaginationLinks } {
    const lastPage = Math.ceil(total / perPage) || 1
    const from = total > 0 ? (page - 1) * perPage + 1 : 0
    const to = Math.min(from + perPage - 1, total)

    const buildLink = (p: number): string => `${basePath}?page=${p}&perPage=${perPage}`

    return {
        meta: {
            currentPage: page,
            from,
            lastPage,
            path: basePath,
            perPage,
            to,
            total,
        },
        links: {
            first: total > 0 ? buildLink(1) : null,
            last: total > 0 ? buildLink(lastPage) : null,
            prev: page > 1 ? buildLink(page - 1) : null,
            next: page < lastPage ? buildLink(page + 1) : null,
        },
    }
}

export function validatePaginationParams(page: number, perPage: number): PaginationParams {
    const validatedPage = Math.max(1, Math.floor(page))
    const validatedPerPage = Math.min(
        DEFAULT_PAGINATION.maxPerPage,
        Math.max(1, Math.floor(perPage)),
    )

    return {
        page: validatedPage,
        perPage: validatedPerPage,
    }
}

export function isValidPaginationParams(
    params: unknown,
): params is { page: number; perPage: number } {
    if (typeof params !== 'object' || params === null) {
        return false
    }

    const p = params as Record<string, unknown>
    return typeof p.page === 'number' && typeof p.perPage === 'number' && p.page > 0 && p.perPage > 0
}
