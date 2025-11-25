

export type VoteType = 'upvote' | 'downvote'

export const VOTE_TYPES = {
    UPVOTE: 'upvote',
    DOWNVOTE: 'downvote',
} as const

export type VoteTypeFromConst = (typeof VOTE_TYPES)[keyof typeof VOTE_TYPES]

export interface Vote {
    id: string
    postId: string
    userId: string
    voteType: VoteType
    createdAt: string
    updatedAt: string
}

export type ValidatedVote = Vote & {
    readonly __brand: 'ValidatedVote'
}

export function isValidVoteType(value: unknown): value is VoteType {
    return value === 'upvote' || value === 'downvote'
}

export function validateVote(vote: Vote): ValidatedVote {
    if (!isValidVoteType(vote.voteType)) {
        throw new Error(`Invalid vote type: ${vote.voteType}`)
    }

    return vote as ValidatedVote
}

export interface VoteScore {
    upvotes: number
    downvotes: number
    score: number
}

export function calculateVoteScore(votes: Vote[]): VoteScore {
    const upvotes = votes.filter((v) => v.voteType === 'upvote').length
    const downvotes = votes.filter((v) => v.voteType === 'downvote').length

    return {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
    }
}

export function isVoteChange(
    existingVote: Vote | undefined,
    newVoteType: VoteType,
): existingVote is Vote {
    return existingVote !== undefined && existingVote.voteType !== newVoteType
}

export function calculateVoteDelta(oldVote: Vote | undefined, newVote: VoteType | null): number {

    if (newVote === null && oldVote) {
        return oldVote.voteType === 'upvote' ? -1 : 1
    }

    if (newVote && !oldVote) {
        return newVote === 'upvote' ? 1 : -1
    }

    if (newVote && oldVote && oldVote.voteType !== newVote) {
        return newVote === 'upvote' ? 2 : -2
    }

    return 0
}
