import { type UserRole, assertIsAdminOrModerator } from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Thread } from '@/types'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadLockerInput {
    threadId: string
    userRole: UserRole
    lock: boolean
}

export class ThreadLocker {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadLockerInput): Promise<Thread> {
        const { threadId, userRole, lock } = input

        assertIsAdminOrModerator(userRole)

        const thread = await this.threadRepository.findById(threadId)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        return this.threadRepository.update(threadId, { isLocked: lock })
    }
}
