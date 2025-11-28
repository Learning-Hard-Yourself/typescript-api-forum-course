import type { User } from '@/app/features/users/models/User'

/**
 * Repository interface for User entity
 */
export interface UserRepository {
    findById(id: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    save(user: Omit<User, 'id'>): Promise<User>
    update(id: string, user: Partial<User>): Promise<User>
    delete(id: string): Promise<void>
}
