import { z } from 'zod'

export const PostEditRequestSchema = z.object({
    content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
    reason: z.string().max(500).optional(),
})

export type PostEditRequestPayload = z.infer<typeof PostEditRequestSchema>

export class PostEditRequest {
    validate(body: unknown): PostEditRequestPayload {
        return PostEditRequestSchema.parse(body)
    }
}
