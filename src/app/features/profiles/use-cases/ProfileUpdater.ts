import type { ProfileUpdateAttributes } from '@/app/features/profiles/requests/ProfileUpdateRequest'
import type { Profile } from '@/types'
import type { ProfileRepository } from '../repositories/ProfileRepository'

export interface ProfileUpdaterInput {
    userId: string
    attributes: ProfileUpdateAttributes
}

export class ProfileUpdater {
    public constructor(private readonly profileRepository: ProfileRepository) {}

    public async execute(input: ProfileUpdaterInput): Promise<Profile> {
        const { userId, attributes } = input

        const existing = await this.profileRepository.findByUserId(userId)

        if (!existing) {
            return this.profileRepository.save({
                userId,
                bio: attributes.bio ?? null,
                location: attributes.location ?? null,
                website: attributes.website ?? null,
                twitterHandle: attributes.twitterHandle ?? null,
                githubUsername: attributes.githubUsername ?? null,
            })
        }

        return this.profileRepository.update(userId, attributes)
    }
}
