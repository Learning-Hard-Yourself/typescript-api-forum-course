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
            // If profile doesn't exist, we might want to return a default one or throw 404.
            // Given the domain, a user always "has" a profile concept, but maybe not a DB row yet if we lazy create.
            // For now, let's assume strict 1:1 and throw if missing, or return nulls.
            // Let's return a default empty profile structure if not found, or create it?
            // "User --< Profile" usually implies existence.
            // Let's throw NotFound for now to be explicit.
            throw new NotFoundError('Profile not found')
        }

        return profile as Profile
    }

    public async update(userId: string, attributes: ProfileUpdateAttributes): Promise<Profile> {
        // Check if profile exists
        const existing = await this.database
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)

        if (existing.length === 0) {
            // Create if not exists (Upsert logic)
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
