import { z } from 'zod'

import { ValidationError } from '@/app/shared/errors/ValidationError'

export const attachmentCreationSchema = z.object({
    postId: z.string().uuid(),
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().positive(),
})

export type AttachmentCreationAttributes = z.infer<typeof attachmentCreationSchema>

export class AttachmentCreationRequest {
    public validate(payload: unknown): AttachmentCreationAttributes {
        const result = attachmentCreationSchema.safeParse(payload)

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
