

import type { ListParams } from '@/app/shared/types/Pagination'

export enum ThreadSortByEnum {
    Newest = 'newest',
    Popular = 'popular',
    MostActive = 'most_active',
}

export type ThreadSortBy = 'newest' | 'popular' | 'most_active'

export const THREAD_SORT_OPTIONS = {
    NEWEST: 'newest',
    POPULAR: 'popular',
    MOST_ACTIVE: 'most_active',
} as const

export type ThreadSortByFromConst =
    (typeof THREAD_SORT_OPTIONS)[keyof typeof THREAD_SORT_OPTIONS]

export type ThreadSortOption = ThreadSortBy

export interface ThreadListParams extends ListParams<ThreadSortBy> {
    categoryId?: string
    authorId?: string
    isPinned?: boolean
    search?: string
}

export const DEFAULT_THREAD_LIST_PARAMS: Partial<ThreadListParams> = {
    sortBy: 'newest',
    sortOrder: 'desc',
}

export function isValidThreadSortBy(value: unknown): value is ThreadSortBy {
    return value === 'newest' || value === 'popular' || value === 'most_active'
}

export function isValidThreadSortByAlt(value: unknown): value is ThreadSortBy {
    const validOptions = Object.values(THREAD_SORT_OPTIONS) as string[]
    return typeof value === 'string' && validOptions.includes(value)
}

export type ThreadFilter =
    | { type: 'category'; categoryId: string }
    | { type: 'author'; authorId: string }
    | { type: 'pinned'; isPinned: boolean }
    | { type: 'search'; query: string }
    | { type: 'none' }

export function describeThreadFilter(filter: ThreadFilter): string {
    switch (filter.type) {
        case 'category':

            return `Filter by category: ${filter.categoryId}`

        case 'author':

            return `Filter by author: ${filter.authorId}`

        case 'pinned':

            return `Filter by pinned: ${filter.isPinned}`

        case 'search':

            return `Search in title: ${filter.query}`

        case 'none':
            return 'No filter applied'

        default:

            const _exhaustive: never = filter
            throw new Error(`Unhandled filter type: ${JSON.stringify(_exhaustive)}`)
    }
}

export function createCategoryFilter(categoryId: string): ThreadFilter {
    return { type: 'category', categoryId }
}

export function createAuthorFilter(authorId: string): ThreadFilter {
    return { type: 'author', authorId }
}

export function createPinnedFilter(isPinned: boolean): ThreadFilter {
    return { type: 'pinned', isPinned }
}

export function createSearchFilter(query: string): ThreadFilter {
    return { type: 'search', query }
}

export function exampleTypeNarrowing(value: unknown): void {

    if (isValidThreadSortBy(value)) {

        console.log(`Valid sort option: ${value}`)
    } else {

        console.log('Invalid sort option')
    }
}

export function exampleDiscriminatedUnion(filter: ThreadFilter): void {

    if (filter.type === 'category') {

        console.log(`Category ID: ${filter.categoryId}`)
    } else if (filter.type === 'search') {

        console.log(`Search query: ${filter.query}`)
    }
}
