import { eq } from 'drizzle-orm'

import type { ProfileUpdateAttributes } from '@/app/features/profiles/requests/ProfileUpdateRequest'
import type { ForumDatabase } from '@/config/database-types'
import { profiles } from '@/config/schema'
import type { Profile } from '@/types'

export interface ProfileUpdaterInput {
    userId: string
    attributes: ProfileUpdateAttributes
}

export class ProfileUpdater {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ProfileUpdaterInput): Promise<Profile> {
        const { userId, attributes } = input

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

        const [profile] = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        return profile as Profile
    }
}
