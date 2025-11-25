import type { User } from '@/config/schema'

/**
 * User Statistics Interface
 *
 * Demonstrates:
 * - Readonly properties for immutability
 * - Interface definition for shape
 */
export interface UserStats {
    readonly threadCount: number
    readonly postCount: number
    readonly reputation: number
    readonly lastActive: string | null
}

/**
 * User with Stats Intersection Type
 *
 * Demonstrates:
 * - Intersection Types (&) to combine two types
 * - Extends the base User type with calculated stats
 */
export type UserWithStats = User & { stats: UserStats }

/**
 * Utility type for just the stats view
 *
 * Demonstrates:
 * - Pick utility type
 */
export type UserStatsView = Pick<UserStats, 'reputation' | 'threadCount' | 'postCount'>
