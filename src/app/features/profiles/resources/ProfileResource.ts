import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Profile } from '@/types'

export interface ProfileOutput {
    userId: string
    bio: string | null
    location: string | null
    website: string | null
    twitterHandle: string | null
    githubUsername: string | null
}

export class ProfileResource extends JsonResource<Profile, ProfileOutput> {
    toArray(): ProfileOutput {
        return {
            userId: this.resource.userId,
            bio: this.resource.bio,
            location: this.resource.location,
            website: this.resource.website,
            twitterHandle: this.resource.twitterHandle,
            githubUsername: this.resource.githubUsername,
        }
    }
}
