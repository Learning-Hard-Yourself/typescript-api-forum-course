import type { User } from '@/app/features/users/models/User'
import type { UserUpdateAttributes } from '@/app/features/users/requests/UserUpdateRequest'
import { ConflictError } from '@/app/shared/errors/ConflictError'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { UserRepository } from '../repositories/UserRepository'

export interface UserUpdateInput {
    readonly id: string
    readonly attributes: UserUpdateAttributes
}

export class UserUpdater {
    public constructor(private readonly userRepository: UserRepository) {}

    public async execute(input: UserUpdateInput): Promise<User> {
        const existing = await this.userRepository.findById(input.id)

        if (!existing) {
            throw new NotFoundError('User not found', { userId: input.id })
        }

        const updatePayload: Record<string, unknown> = {}

        if (input.attributes.username !== undefined) {
            updatePayload.username = input.attributes.username
        }

        if (input.attributes.email !== undefined) {
            updatePayload.email = input.attributes.email
        }

        if (input.attributes.displayName !== undefined) {
            updatePayload.displayName = input.attributes.displayName
        }

        if (input.attributes.avatarUrl !== undefined) {
            updatePayload.avatarUrl = input.attributes.avatarUrl
        }

        if (input.attributes.role !== undefined) {
            updatePayload.role = input.attributes.role
        }

        // Check for uniqueness conflicts
        if (input.attributes.username || input.attributes.email) {
            const conflict = await this.userRepository.findByEmailOrUsername(
                input.attributes.email ?? '',
                input.attributes.username ?? '',
                input.id,
            )

            if (conflict) {
                throw new ConflictError('User with provided email or username already exists', {
                    userId: conflict.id,
                    attemptedId: input.id,
                    username: input.attributes.username,
                    email: input.attributes.email,
                })
            }
        }

        return this.userRepository.update(input.id, updatePayload as Partial<User>)
    }
}
