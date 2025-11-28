import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { profiles } from '@/config/schema'
import type { Profile } from '@/types'

export interface ProfileFinderInput {
    userId: string
}

export class ProfileFinder {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ProfileFinderInput): Promise<Profile> {
        const [profile] = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, input.userId))
            .limit(1)

        if (!profile) {
            throw new NotFoundError('Profile not found')
        }

        return profile as Profile
    }
}
