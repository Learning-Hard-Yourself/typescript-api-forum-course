import type { User, UserRole } from '@/app/features/users/models/User'
import { JsonResource } from '@/app/shared/resources/JsonResource'

export interface UserOutput {
    id: string
    username: string
    email: string
    displayName: string
    avatarUrl: string | null
    role: UserRole
    createdAt: string
    updatedAt: string
    lastActiveAt: string
}

export class UserResource extends JsonResource<User, UserOutput> {
    toArray(): UserOutput {
        return {
            id: this.resource.id,
            username: this.resource.username,
            email: this.resource.email,
            displayName: this.resource.displayName,
            avatarUrl: this.resource.avatarUrl,
            role: this.resource.role,
            createdAt: this.resource.createdAt,
            updatedAt: this.resource.updatedAt,
            lastActiveAt: this.resource.lastActiveAt,
        }
    }
}
