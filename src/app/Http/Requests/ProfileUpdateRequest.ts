import { z } from 'zod'

import { ValidationError } from '@/app/Errors/ValidationError'

export const profileUpdateSchema = z.object({
    bio: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    website: z.string().url().nullable().optional(),
    twitterHandle: z.string().nullable().optional(),
    githubUsername: z.string().nullable().optional(),
})

export type ProfileUpdateAttributes = z.infer<typeof profileUpdateSchema>

export class ProfileUpdateRequest {
    public validate(payload: unknown): ProfileUpdateAttributes {
        const result = profileUpdateSchema.safeParse(payload)

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
