import { z } from 'zod'

export const ThreadListRequestSchema = z.object({

    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),

    sortBy: z.enum(['newest', 'popular', 'most_active']).default('newest'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),

    categoryId: z.string().optional(),
    authorId: z.string().optional(),
    isPinned: z.coerce.boolean().optional(),
    search: z.string().optional(),
})

export type ThreadListRequest = z.infer<typeof ThreadListRequestSchema>
