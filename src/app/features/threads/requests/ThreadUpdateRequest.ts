import { z } from 'zod'

export const ThreadUpdateRequestSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long').optional(),
    isPinned: z.boolean().optional(),
    isLocked: z.boolean().optional(),
})

export type ThreadUpdateRequest = z.infer<typeof ThreadUpdateRequestSchema>
