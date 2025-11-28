import { z } from 'zod'

export const ThreadCursorListRequestSchema = z
    .object({
        after: z.string().optional(),
        before: z.string().optional(),
        first: z.coerce.number().int().min(1).max(100).optional(),
        last: z.coerce.number().int().min(1).max(100).optional(),
        sortBy: z.enum(['newest', 'popular', 'most_active']).default('newest'),
        categoryId: z.string().optional(),
        authorId: z.string().optional(),
        isPinned: z.coerce.boolean().optional(),
        search: z.string().optional(),
    })
    .refine(
        (data) => !(data.after && data.before),
        { message: 'Cannot use both "after" and "before" cursors' },
    )
    .refine(
        (data) => !(data.first && data.last),
        { message: 'Cannot use both "first" and "last"' },
    )

export type ThreadCursorListRequest = z.infer<typeof ThreadCursorListRequestSchema>
