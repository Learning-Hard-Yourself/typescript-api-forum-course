import { z } from 'zod'

import { ValidationError } from '@/app/shared/errors/ValidationError'

export const categoryUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    order: z.number().int().optional(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
})

export type CategoryUpdateAttributes = z.infer<typeof categoryUpdateSchema>

export class CategoryUpdateRequest {
    public validate(payload: unknown): CategoryUpdateAttributes {
        const result = categoryUpdateSchema.safeParse(payload)

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
