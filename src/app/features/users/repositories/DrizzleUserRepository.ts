import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { User } from '@/app/features/users/models/User'
import type { ForumDatabase } from '@/config/database-types'
import { users } from '@/config/schema'
import type { UserRepository } from './UserRepository'

/**
 * Drizzle ORM implementation of UserRepository
 */
export class DrizzleUserRepository implements UserRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)

        return (user as User) ?? null
    }

    async findByEmail(email: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        return (user as User) ?? null
    }

    async findByUsername(username: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)

        return (user as User) ?? null
    }

    async save(user: Omit<User, 'id'>): Promise<User> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(users)
            .values({
                id: uuidv7(),
                ...user,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as User
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        const [updated] = await this.database
            .update(users)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(users.id, id))
            .returning()

        return updated as User
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(users).where(eq(users.id, id))
    }
}
