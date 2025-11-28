import { z } from 'zod'

import type { VoteType } from '@/app/features/votes/models/Vote'
import { isValidVoteType, VOTE_TYPES } from '@/app/features/votes/models/Vote'

export class VoteRequest {
    public readonly schema = z.object({
        voteType: z
            .string()
            .refine(isValidVoteType, {
                message: `Vote type must be '${VOTE_TYPES.UPVOTE}' or '${VOTE_TYPES.DOWNVOTE}'`,
            })
            .transform((val) => val as VoteType),
    })

    public validate(data: unknown): z.infer<typeof this.schema> {
        return this.schema.parse(data)
    }
}
