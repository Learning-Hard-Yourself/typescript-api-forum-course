import type { User } from '@/app/features/users/models/User'

export interface UserStats {
    threadCount: number
    postCount: number
    reputation: number
    lastActive: string | null
}

/**
 * Repository interface for User entity
 */
export interface UserRepository {
    findById(id: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    findByEmailOrUsername(email: string, username: string, excludeId?: string): Promise<User | null>
    save(user: Omit<User, 'id'>): Promise<User>
    update(id: string, user: Partial<User>): Promise<User>
    delete(id: string): Promise<void>
    getStats(userId: string): Promise<UserStats>
}
