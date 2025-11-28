import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadFinderInput {
    id: string
}

/**
 * Use case for finding a thread by ID.
 */
export class ThreadFinder {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadFinderInput): Promise<Thread> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, input.id),
        })

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${input.id} not found`)
        }

        return thread as Thread
    }
}
