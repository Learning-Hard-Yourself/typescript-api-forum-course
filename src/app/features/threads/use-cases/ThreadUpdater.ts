import { eq } from 'drizzle-orm'

import {
    type ThreadUpdatePayload,
    type UserRole,
    assertCanUpdate,
    filterUpdateByRole,
} from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadUpdaterInput {
    threadId: string
    userId: string
    userRole: UserRole
    updateData: ThreadUpdatePayload
}

/**
 * Use case for updating a thread's content.
 */
export class ThreadUpdater {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadUpdaterInput): Promise<Thread> {
        const { threadId, userId, userRole, updateData } = input

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const isAuthor = thread.authorId === userId
        assertCanUpdate(userRole, updateData, isAuthor)

        const allowedUpdate = filterUpdateByRole(userRole, updateData)

        const [updatedThread] = await this.database
            .update(threads)
            .set({
                ...allowedUpdate,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread')
        }

        return updatedThread as Thread
    }
}
