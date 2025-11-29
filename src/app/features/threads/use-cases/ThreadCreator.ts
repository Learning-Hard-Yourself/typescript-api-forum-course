import type { ThreadCreationAttributes } from '@/app/features/threads/requests/ThreadCreationRequest'
import type { Thread } from '@/types'
import type { ThreadRepository } from '../repositories/ThreadRepository'

export interface ThreadCreatorInput {
    authorId: string
    attributes: ThreadCreationAttributes
}

export class ThreadCreator {
    public constructor(private readonly threadRepository: ThreadRepository) {}

    public async execute(input: ThreadCreatorInput): Promise<Thread> {
        const { authorId, attributes } = input

        return this.threadRepository.saveWithInitialPost({
            categoryId: attributes.categoryId,
            authorId,
            title: attributes.title,
            slug: attributes.slug ?? this.generateSlug(attributes.title),
            content: attributes.content,
        })
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
