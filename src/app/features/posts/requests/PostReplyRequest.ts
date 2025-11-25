import { z } from 'zod'

export class PostReplyRequest {
    public readonly schema = z.object({
        content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
    })

    public validate(data: unknown): z.infer<typeof this.schema> {
        return this.schema.parse(data)
    }
}
