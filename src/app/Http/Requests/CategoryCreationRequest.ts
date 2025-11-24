import { z } from 'zod'

import { ValidationError } from '@/app/Errors/ValidationError'

export const categoryCreationSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    order: z.number().int().default(0),
})

export type CategoryCreationAttributes = z.infer<typeof categoryCreationSchema>

export class CategoryCreationRequest {
    public validate(payload: unknown): CategoryCreationAttributes {
        const result = categoryCreationSchema.safeParse(payload)

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
