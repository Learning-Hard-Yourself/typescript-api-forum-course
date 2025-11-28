import { eq } from 'drizzle-orm'

import { type UserRole, assertIsAdminOrModerator } from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadLockerInput {
    threadId: string
    userRole: UserRole
    lock: boolean
}

/**
 * Use case for locking or unlocking a thread.
 */
export class ThreadLocker {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadLockerInput): Promise<Thread> {
        const { threadId, userRole, lock } = input

        assertIsAdminOrModerator(userRole)

        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${threadId} not found`)
        }

        const [updatedThread] = await this.database
            .update(threads)
            .set({
                isLocked: lock,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread lock status')
        }

        return updatedThread as Thread
    }
}
