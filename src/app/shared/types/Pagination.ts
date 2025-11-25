/**
 * Pagination Types
 *
 * Demonstrates:
 * - Generic Types for reusability across all resources
 * - Intersection Types for combining type contracts
 * - Type-safe pagination with metadata
 *
 * Educational Focus:
 * This file shows how to create reusable, type-safe pagination
 * infrastructure that works with ANY data type. The generic <T>
 * makes this extremely flexible and maintainable.
 */

// ================================
// GENERIC PAGINATION RESPONSE
// ================================

/**
 * Generic paginated response
 *
 * Learning: Generic type <T> allows this interface to work with
 * any data type (Thread, Post, User, etc.) while maintaining
 * full type safety!
 *
 * Example:
 * - PaginatedResponse<Thread> contains Thread[]
 * - PaginatedResponse<User> contains User[]
 */
export interface PaginatedResponse<T> {
    data: T[]
    links: PaginationLinks
    meta: PaginationMeta
}

/**
 * Pagination links for navigation
 * Follows Laravel-style pagination
 */
export interface PaginationLinks {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
}

/**
 * Pagination metadata
 * Provides all information needed for pagination UI
 */
export interface PaginationMeta {
    currentPage: number
    from: number // First item number on current page
    lastPage: number
    path: string // Base URL path
    perPage: number
    to: number // Last item number on current page
    total: number // Total items across all pages
}

// ================================
// PAGINATION PARAMETERS
// ================================

/**
 * Basic pagination parameters
 */
export interface PaginationParams {
    page: number
    perPage: number
}

/**
 * Default pagination configuration
 * Uses 'as const' for stricter typing
 */
export const DEFAULT_PAGINATION = {
    page: 1,
    perPage: 20,
    maxPerPage: 100,
} as const

// ================================
// GENERIC SORT PARAMETERS
// ================================

/**
 * Generic sort parameters with type safety
 *
 * Learning: The generic TSortBy constrains which fields can be sorted.
 * This prevents typos and ensures only valid sort options are used.
 *
 * Example:
 * type ThreadSort = SortParams<'newest' | 'popular'>
 * // sortBy can only be 'newest' or 'popular', not 'invalid'!
 *
 * @template TSortBy - Union of allowed sort field names
 */
export interface SortParams<TSortBy extends string = string> {
    sortBy: TSortBy
    sortOrder: 'asc' | 'desc'
}

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Default sort order
 */
export const DEFAULT_SORT_ORDER: SortOrder = 'desc'

// ================================
// INTERSECTION TYPES
// ================================

/**
 * Combines pagination and sorting using intersection types
 *
 * Learning: The & operator creates an intersection type that
 * combines multiple types into one. ListParams contains ALL
 * properties from both PaginationParams AND SortParams.
 *
 * Partial<SortParams> makes sorting optional while pagination required.
 *
 * @template TSortBy - Union of allowed sort options
 */
export type ListParams<TSortBy extends string = string> = PaginationParams &
    Partial<SortParams<TSortBy>>

/**
 * Example usage of intersection types:
 */
// type ThreadListParams = ListParams<'newest' | 'popular'> & {
//   categoryId?: string
//   isPinned?: boolean
// }
// Result: { page, perPage, sortBy?, sortOrder?, categoryId?, isPinned? }

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Calculate pagination metadata
 *
 * @param page - Current page number
 * @param perPage - Items per page
 * @param total - Total number of items
 * @param basePath - Base URL path for links
 * @returns Complete pagination metadata
 */
export function calculatePaginationMeta(
    page: number,
    perPage: number,
    total: number,
    basePath: string,
): { meta: PaginationMeta; links: PaginationLinks } {
    const lastPage = Math.ceil(total / perPage) || 1
    const from = total > 0 ? (page - 1) * perPage + 1 : 0
    const to = Math.min(from + perPage - 1, total)

    // Build query string helper
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

/**
 * Validate pagination parameters
 *
 * @param page - Page number to validate
 * @param perPage - Items per page to validate
 * @returns Validated and constrained parameters
 */
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

/**
 * Type guard for pagination params
 */
export function isValidPaginationParams(
    params: unknown,
): params is { page: number; perPage: number } {
    if (typeof params !== 'object' || params === null) {
        return false
    }

    const p = params as Record<string, unknown>
    return typeof p.page === 'number' && typeof p.perPage === 'number' && p.page > 0 && p.perPage > 0
}
