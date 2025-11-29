import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Thread } from '@/types'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadFinderInput {
    id: string
}

export class ThreadFinder {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadFinderInput): Promise<Thread> {
        const thread = await this.threadRepository.findById(input.id)

        if (!thread) {
            throw new NotFoundError(`Thread with ID ${input.id} not found`)
        }

        return thread
    }
}
