import { z } from 'zod'

export const PostDeleteRequestSchema = z.object({
    reason: z.string().max(500).optional(),
})

export type PostDeleteRequestPayload = z.infer<typeof PostDeleteRequestSchema>

export class PostDeleteRequest {
    validate(body: unknown): PostDeleteRequestPayload {
        return PostDeleteRequestSchema.parse(body)
    }
}
