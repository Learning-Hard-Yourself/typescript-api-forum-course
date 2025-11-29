import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Profile } from '@/types'
import type { ProfileRepository } from '../repositories/ProfileRepository'

export interface ProfileFinderInput {
    userId: string
}

export class ProfileFinder {
    public constructor(private readonly profileRepository: ProfileRepository) {}

    public async execute(input: ProfileFinderInput): Promise<Profile> {
        const profile = await this.profileRepository.findByUserId(input.userId)

        if (!profile) {
            throw new NotFoundError('Profile not found')
        }

        return profile
    }
}
