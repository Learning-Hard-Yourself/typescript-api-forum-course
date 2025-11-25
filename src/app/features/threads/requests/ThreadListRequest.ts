import { z } from 'zod'

/**
 * Thread List Request Validation
 *
 * Uses Zod for runtime validation with type coercion
 * for query parameters (which come as strings)
 */

export const ThreadListRequestSchema = z.object({
    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),

    // Sorting
    sortBy: z.enum(['newest', 'popular', 'most_active']).default('newest'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),

    // Filters
    categoryId: z.string().optional(),
    authorId: z.string().optional(),
    isPinned: z.coerce.boolean().optional(),
    search: z.string().optional(),
})

export type ThreadListRequest = z.infer<typeof ThreadListRequestSchema>
