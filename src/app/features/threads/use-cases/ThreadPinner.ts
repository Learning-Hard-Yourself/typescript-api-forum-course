import { eq } from 'drizzle-orm'

import { type UserRole, assertIsAdminOrModerator } from '@/app/features/threads/models/ThreadUpdate'
import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadPinnerInput {
    threadId: string
    userRole: UserRole
    pin: boolean
}

/**
 * Use case for pinning or unpinning a thread.
 */
export class ThreadPinner {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadPinnerInput): Promise<Thread> {
        const { threadId, userRole, pin } = input

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
                isPinned: pin,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(threads.id, threadId))
            .returning()

        if (!updatedThread) {
            throw new Error('Failed to update thread pin status')
        }

        return updatedThread as Thread
    }
}
