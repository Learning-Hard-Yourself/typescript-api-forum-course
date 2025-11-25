import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ProfileUpdateAttributes } from '@/app/features/profiles/requests/ProfileUpdateRequest'
import { profiles } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'
import type { Profile } from '@/types'

export class ProfileService {
    public constructor(private readonly database: ForumDatabase) { }

    public async getByUserId(userId: string): Promise<Profile> {
        const [profile] = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        if (!profile) {

            throw new NotFoundError('Profile not found')
        }

        return profile as Profile
    }

    public async update(userId: string, attributes: ProfileUpdateAttributes): Promise<Profile> {

        const existing = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        if (existing.length === 0) {

            await this.database.insert(profiles).values({
                userId,
                ...attributes,
            })
        } else {
            await this.database
                .update(profiles)
                .set(attributes)
                .where(eq(profiles.userId, userId))
        }

        return this.getByUserId(userId)
    }
}
