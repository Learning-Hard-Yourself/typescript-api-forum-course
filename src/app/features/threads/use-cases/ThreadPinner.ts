import { type UserRole, assertIsAdminOrModerator } from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Thread } from '@/types'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadPinnerInput {
    threadId: string
    userRole: UserRole
    pin: boolean
}

export class ThreadPinner {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadPinnerInput): Promise<Thread> {
        const { threadId, userRole, pin } = input

        assertIsAdminOrModerator(userRole)

        const thread = await this.threadRepository.findById(threadId)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        return this.threadRepository.update(threadId, { isPinned: pin })
    }
}
