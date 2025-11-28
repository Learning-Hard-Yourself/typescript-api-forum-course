import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors'
import type { ForumDatabase } from '@/config/database-types'
import { threads } from '@/config/schema'
import type { Thread } from '@/types'

export interface ThreadFinderInput {
    id: string
}

export class ThreadFinder {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: ThreadFinderInput): Promise<Thread> {
        const thread = await this.findById(input.id)
        if (!thread) throw new NotFoundError(`Thread with ID ${input.id} not found`)
        return thread
    }

    private async findById(id: string): Promise<Thread | null> {
        const [result] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.id, id))
            .limit(1)
        return (result as Thread) ?? null
    }
}
