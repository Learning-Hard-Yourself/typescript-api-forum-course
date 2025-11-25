import type { User } from '@/config/schema'

export interface UserStats {
    readonly threadCount: number
    readonly postCount: number
    readonly reputation: number
    readonly lastActive: string | null
}

export type UserWithStats = User & { stats: UserStats }

export type UserStatsView = Pick<UserStats, 'reputation' | 'threadCount' | 'postCount'>
