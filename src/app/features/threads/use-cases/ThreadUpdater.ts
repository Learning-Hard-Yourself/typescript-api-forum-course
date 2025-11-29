import {
    type ThreadUpdatePayload,
    type UserRole,
    assertCanUpdate,
    filterUpdateByRole,
} from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Thread } from '@/types'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadUpdaterInput {
    threadId: string
    userId: string
    userRole: UserRole
    updateData: ThreadUpdatePayload
}

export class ThreadUpdater {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadUpdaterInput): Promise<Thread> {
        const { threadId, userId, userRole, updateData } = input

        const thread = await this.threadRepository.findById(threadId)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const isAuthor = thread.authorId === userId
        assertCanUpdate(userRole, updateData, isAuthor)

        const allowedUpdate = filterUpdateByRole(userRole, updateData)

        return this.threadRepository.update(threadId, allowedUpdate)
    }
}
