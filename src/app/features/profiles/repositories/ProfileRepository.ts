import type { Profile } from '@/types'


export interface ProfileRepository {
    findByUserId(userId: string): Promise<Profile | null>
    save(profile: Profile): Promise<Profile>
    update(userId: string, profile: Partial<Profile>): Promise<Profile>
    delete(userId: string): Promise<void>
}
