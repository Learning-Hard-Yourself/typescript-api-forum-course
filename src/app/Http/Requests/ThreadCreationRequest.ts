import { z } from 'zod'

import { ValidationError } from '@/app/Errors/ValidationError'

export const threadCreationSchema = z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(3).max(255),
    content: z.string().min(10), // Initial post content
    slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/).optional(), // Optional, can be generated
})

export type ThreadCreationAttributes = z.infer<typeof threadCreationSchema>

export class ThreadCreationRequest {
    public validate(payload: unknown): ThreadCreationAttributes {
        const result = threadCreationSchema.safeParse(payload)

        if (result.success) {
            return result.data
        }

        const details = result.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'body',
            message: issue.message,
        }))

        throw new ValidationError(details)
    }
}
