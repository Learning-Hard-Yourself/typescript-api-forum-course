/**
 * Vote Model - Demonstrates Advanced TypeScript Concepts
 *
 * This file showcases:
 * 1. Discriminated Unions for vote types
 * 2. Branded Types for type-safe validation
 * 3. Type Guards for runtime type checking
 * 4. Const Assertions for immutable values
 */

// ==================================================
// 1. DISCRIMINATED UNION - Vote Type
// ==================================================
// Using a discriminated union ensures type safety at compile time
// Only 'upvote' or 'downvote' are allowed - no magic strings!
export type VoteType = 'upvote' | 'downvote'

// Const assertion makes this object readonly and types literal
export const VOTE_TYPES = {
    UPVOTE: 'upvote',
    DOWNVOTE: 'downvote',
} as const

// Extract the type from the const object
export type VoteTypeFromConst = (typeof VOTE_TYPES)[keyof typeof VOTE_TYPES]

// ==================================================
// 2. BASE VOTE INTERFACE
// ==================================================
export interface Vote {
    id: string
    postId: string
    userId: string
    voteType: VoteType
    createdAt: string
    updatedAt: string
}

// ==================================================
// 3. BRANDED TYPE - Validated Vote
// ==================================================
// Branded types prevent mixing validated and unvalidated data
// The __brand property only exists at the type level (not runtime)
export type ValidatedVote = Vote & {
    readonly __brand: 'ValidatedVote'
}

/**
 * Type guard to validate vote type
 * Uses type predicate (value is VoteType) for type narrowing
 */
export function isValidVoteType(value: unknown): value is VoteType {
    return value === 'upvote' || value === 'downvote'
}

/**
 * Validate and brand a vote
 * This is the only way to create a ValidatedVote
 */
export function validateVote(vote: Vote): ValidatedVote {
    if (!isValidVoteType(vote.voteType)) {
        throw new Error(`Invalid vote type: ${vote.voteType}`)
    }

    // Type assertion is safe here because we validated
    return vote as ValidatedVote
}

// ==================================================
// 4. VOTE SCORE CALCULATION
// ==================================================
export interface VoteScore {
    upvotes: number
    downvotes: number
    score: number // upvotes - downvotes
}

/**
 * Calculate vote score from vote list
 * Demonstrates: Type narrowing, Array methods with types
 */
export function calculateVoteScore(votes: Vote[]): VoteScore {
    const upvotes = votes.filter((v) => v.voteType === 'upvote').length
    const downvotes = votes.filter((v) => v.voteType === 'downvote').length

    return {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
    }
}

// ==================================================
// 5. VOTE CHANGE DETECTION
// ==================================================
/**
 * Determine if a vote is being changed (upvote to downvote or vice versa)
 * Demonstrates: Optional parameters, Type guards
 */
export function isVoteChange(
    existingVote: Vote | undefined,
    newVoteType: VoteType,
): existingVote is Vote {
    return existingVote !== undefined && existingVote.voteType !== newVoteType
}

// ==================================================
// 6. TYPE-SAFE VOTE DELTA
// ==================================================
/**
 * Calculate the delta to apply to post voteScore
 * Returns: +1 for upvote, -1 for downvote, 0 for no change
 */
export function calculateVoteDelta(oldVote: Vote | undefined, newVote: VoteType | null): number {
    // Removing vote
    if (newVote === null && oldVote) {
        return oldVote.voteType === 'upvote' ? -1 : 1
    }

    // Adding new vote
    if (newVote && !oldVote) {
        return newVote === 'upvote' ? 1 : -1
    }

    // Changing vote
    if (newVote && oldVote && oldVote.voteType !== newVote) {
        return newVote === 'upvote' ? 2 : -2
    }

    // No change
    return 0
}
