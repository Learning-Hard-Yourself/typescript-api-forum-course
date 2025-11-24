import { z } from 'zod'

import { ValidationError } from '@/app/Errors/ValidationError'

export const postCreationSchema = z.object({
    threadId: z.string().uuid(),
    parentPostId: z.string().uuid().nullable().optional(),
    content: z.string().min(1),
})

export type PostCreationAttributes = z.infer<typeof postCreationSchema>

export class PostCreationRequest {
    public validate(payload: unknown): PostCreationAttributes {
        const result = postCreationSchema.safeParse(payload)

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
