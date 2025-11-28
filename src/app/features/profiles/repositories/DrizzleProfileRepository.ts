import { eq } from 'drizzle-orm'

import type { ForumDatabase } from '@/config/database-types'
import { profiles } from '@/config/schema'
import type { Profile } from '@/types'
import type { ProfileRepository } from './ProfileRepository'

/**
 * Drizzle ORM implementation of ProfileRepository
 */
export class DrizzleProfileRepository implements ProfileRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findByUserId(userId: string): Promise<Profile | null> {
        const [profile] = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        return (profile as Profile) ?? null
    }

    async save(profile: Profile): Promise<Profile> {
        const [created] = await this.database
            .insert(profiles)
            .values(profile)
            .returning()

        return created as Profile
    }

    async update(userId: string, data: Partial<Profile>): Promise<Profile> {
        const [updated] = await this.database
            .update(profiles)
            .set(data)
            .where(eq(profiles.userId, userId))
            .returning()

        return updated as Profile
    }

    async delete(userId: string): Promise<void> {
        await this.database.delete(profiles).where(eq(profiles.userId, userId))
    }
}
