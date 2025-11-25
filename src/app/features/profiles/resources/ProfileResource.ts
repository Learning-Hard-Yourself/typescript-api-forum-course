import type { Profile } from '@/types'

export class ProfileResource {
    public toResponse(profile: Profile): Profile {
        return profile
    }
}
