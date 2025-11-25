/**
 * Thread Listing Types
 *
 * Demonstrates:
 * - Enum vs Union Types (educational comparison)
 * - Type Narrowing with discriminated unions
 * - Type Guards for validation
 * - Const assertions as best practice
 *
 * Educational Focus:
 * This file compares different approaches to defining a fixed set of
 * values in TypeScript, showing the trade-offs between each approach.
 */

import type { ListParams } from '@/app/shared/types/Pagination'

// ================================
// ENUM VS UNION TYPES (COMPARISON)
// ================================

/**
 * APPROACH 1: ENUM
 *
 * Pros:
 * - Creates a runtime object you can iterate over
 * - Namespaced values (ThreadSortByEnum.Newest)
 * - Supports reverse mapping (get name from value)
 * - Can add methods and computed members
 *
 * Cons:
 * - Generates JavaScript code (increases bundle size)
 * - More complex than necessary for simple cases
 * - String enums don't have reverse mapping
 * - Harder to use with const assertions
 *
 * When to use:
 * - Need to iterate over all values
 * - Want namespace organization
 * - Building a library (better encapsulation)
 */
export enum ThreadSortByEnum {
    Newest = 'newest',
    Popular = 'popular',
    MostActive = 'most_active',
}

// You can iterate over enum values:
// Object.values(ThreadSortByEnum) => ['newest', 'popular', 'most_active']

/**
 * APPROACH 2: UNION TYPE
 *
 * Pros:
 * - No runtime code (pure TypeScript, zero JavaScript)
 * - Simpler and more lightweight
 * - Works perfectly with const assertions
 * - More idiomatic TypeScript
 *
 * Cons:
 * - Can't iterate over values at runtime
 * - No namespace (values are global strings)
 * - No reverse mapping
 *
 * When to use:
 * - Simple discriminated unions
 * - Want minimal JavaScript output
 * - Using with const assertions
 * - Most common choice in modern TypeScript
 */
export type ThreadSortBy = 'newest' | 'popular' | 'most_active'

/**
 * APPROACH 3: CONST ASSERTION (BEST PRACTICE!)
 *
 * This combines the best of both worlds:
 * - Runtime object for iteration (like enum)
 * - Minimal JavaScript output
 * - Type-safe values
 * - Can extract type from const
 *
 * This is the RECOMMENDED approach for most use cases!
 */
export const THREAD_SORT_OPTIONS = {
    NEWEST: 'newest',
    POPULAR: 'popular',
    MOST_ACTIVE: 'most_active',
} as const

// Extract union type from const
export type ThreadSortByFromConst =
    (typeof THREAD_SORT_OPTIONS)[keyof typeof THREAD_SORT_OPTIONS]

// Now you can:
// 1. Iterate: Object.values(THREAD_SORT_OPTIONS)
// 2. Use as type: ThreadSortByFromConst
// 3. Access namespaced: THREAD_SORT_OPTIONS.NEWEST

/**
 * For this project, we'll use the union type approach
 * to keep it simple and lightweight
 */
export type ThreadSortOption = ThreadSortBy

// ================================
// THREAD LIST PARAMETERS
// ================================

/**
 * Thread-specific listing parameters
 *
 * Learning: This extends the generic ListParams<T> with
 * thread-specific filters. The generic TSortBy is constrained
 * to ThreadSortBy, ensuring type safety for sort options.
 */
export interface ThreadListParams extends ListParams<ThreadSortBy> {
    categoryId?: string
    authorId?: string
    isPinned?: boolean
    search?: string
}

/**
 * Default thread list parameters
 */
export const DEFAULT_THREAD_LIST_PARAMS: Partial<ThreadListParams> = {
    sortBy: 'newest',
    sortOrder: 'desc',
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for ThreadSortBy
 *
 * Learning: Type guards use the 'is' keyword to narrow types.
 * After this function returns true, TypeScript knows the value
 * is specifically ThreadSortBy, not just unknown or string.
 *
 * @param value - Value to check
 * @returns true if value is a valid sort option
 */
export function isValidThreadSortBy(value: unknown): value is ThreadSortBy {
    return value === 'newest' || value === 'popular' || value === 'most_active'
}

/**
 * Alternative implementation using const assertion
 */
export function isValidThreadSortByAlt(value: unknown): value is ThreadSortBy {
    const validOptions = Object.values(THREAD_SORT_OPTIONS) as string[]
    return typeof value === 'string' && validOptions.includes(value)
}

// ================================
// DISCRIMINATED UNIONS FOR FILTERS
// ================================

/**
 * Discriminated union for different filter types
 *
 * Learning: Discriminated unions use a common 'type' property
 * to distinguish between different shapes. TypeScript can then
 * narrow the type based on checking the 'type' property.
 *
 * This is extremely powerful for type-safe polymorphism!
 */
export type ThreadFilter =
    | { type: 'category'; categoryId: string }
    | { type: 'author'; authorId: string }
    | { type: 'pinned'; isPinned: boolean }
    | { type: 'search'; query: string }
    | { type: 'none' }

/**
 * Type narrowing with switch statement
 *
 * Learning: When you switch on the 'type' property, TypeScript
 * automatically narrows the type in each case block. This gives
 * you full IntelliSense and type safety!
 *
 * The 'never' in the default case provides exhaustiveness checking.
 * If you add a new filter type and forget to handle it, TypeScript
 * will error!
 *
 * @param filter - Filter to apply
 * @returns SQL-like filter string (example only)
 */
export function describeThreadFilter(filter: ThreadFilter): string {
    switch (filter.type) {
        case 'category':
            // TypeScript knows filter.categoryId exists here!
            return `Filter by category: ${filter.categoryId}`

        case 'author':
            // TypeScript knows filter.authorId exists here!
            return `Filter by author: ${filter.authorId}`

        case 'pinned':
            // TypeScript knows filter.isPinned exists here!
            return `Filter by pinned: ${filter.isPinned}`

        case 'search':
            // TypeScript knows filter.query exists here!
            return `Search in title: ${filter.query}`

        case 'none':
            return 'No filter applied'

        default:
            // Exhaustiveness check: if we add a new filter type and
            // forget to handle it here, TypeScript will error!
            const _exhaustive: never = filter
            throw new Error(`Unhandled filter type: ${JSON.stringify(_exhaustive)}`)
    }
}

/**
 * Create a category filter
 */
export function createCategoryFilter(categoryId: string): ThreadFilter {
    return { type: 'category', categoryId }
}

/**
 * Create an author filter
 */
export function createAuthorFilter(authorId: string): ThreadFilter {
    return { type: 'author', authorId }
}

/**
 * Create a pinned filter
 */
export function createPinnedFilter(isPinned: boolean): ThreadFilter {
    return { type: 'pinned', isPinned }
}

/**
 * Create a search filter
 */
export function createSearchFilter(query: string): ThreadFilter {
    return { type: 'search', query }
}

// ================================
// TYPE NARROWING EXAMPLES
// ================================

/**
 * Example of type narrowing with type guards
 */
export function exampleTypeNarrowing(value: unknown): void {
    // value is unknown here

    if (isValidThreadSortBy(value)) {
        // TypeScript knows value is ThreadSortBy here!
        // You get full autocomplete for 'newest' | 'popular' | 'most_active'
        console.log(`Valid sort option: ${value}`)
    } else {
        // value is still unknown here
        console.log('Invalid sort option')
    }
}

/**
 * Example of type narrowing with discriminated unions
 */
export function exampleDiscriminatedUnion(filter: ThreadFilter): void {
    // Check the discriminant property
    if (filter.type === 'category') {
        // TypeScript knows filter is { type: 'category'; categoryId: string }
        console.log(`Category ID: ${filter.categoryId}`)
    } else if (filter.type === 'search') {
        // TypeScript knows filter is { type: 'search'; query: string }
        console.log(`Search query: ${filter.query}`)
    }
}
