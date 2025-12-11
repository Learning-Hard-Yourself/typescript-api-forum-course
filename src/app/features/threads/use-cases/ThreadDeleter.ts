import { type UserRole, assertIsAdminOrModerator } from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadDeleterInput {
    threadId: string
    userRole: UserRole
}

export class ThreadDeleter {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadDeleterInput): Promise<void> {
        const { threadId, userRole } = input

        assertIsAdminOrModerator(userRole)

        const thread = await this.threadRepository.findById(threadId)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        await this.threadRepository.delete(threadId)
    }
}
