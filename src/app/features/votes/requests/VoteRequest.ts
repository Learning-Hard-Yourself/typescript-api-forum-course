import { z } from 'zod'

import { isValidVoteType, VOTE_TYPES } from '@/app/features/votes/models/Vote'

/**
 * Vote Request Validation
 *
 * Demonstrates: Zod schema validation with custom refinements
 */
export class VoteRequest {
    /**
     * Schema for casting a vote
     * Uses custom refine() to validate vote type at runtime
     */
    public readonly schema = z.object({
        voteType: z
            .string()
            .refine(isValidVoteType, {
                message: `Vote type must be '${VOTE_TYPES.UPVOTE}' or '${VOTE_TYPES.DOWNVOTE}'`,
            })
            .transform((val) => val as import('@/app/features/votes/models/Vote').VoteType),
    })

    public validate(data: unknown): z.infer<typeof this.schema> {
        return this.schema.parse(data)
    }
}
