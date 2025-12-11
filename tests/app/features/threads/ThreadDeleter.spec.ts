import { describe, expect, it } from 'vitest'

import type { ThreadRepository } from '@/app/features/threads/repositories/ThreadRepository'
import { ThreadDeleter } from '@/app/features/threads/use-cases/ThreadDeleter'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Thread } from '@/types'

class InMemoryThreadRepository implements ThreadRepository {
    private readonly threads = new Map<string, Thread>()

    public constructor(initialThreads: Thread[] = []) {
        for (const thread of initialThreads) {
            this.threads.set(thread.id, thread)
        }
    }

    public async findById(id: string): Promise<Thread | null> {
        return this.threads.get(id) ?? null
    }

    public async findBySlug(slug: string): Promise<Thread | null> {
        for (const thread of this.threads.values()) {
            if (thread.slug === slug) {
                return thread
            }
        }

        return null
    }

    public async findByCategoryId(categoryId: string): Promise<Thread[]> {
        const result: Thread[] = []

        for (const thread of this.threads.values()) {
            if (thread.categoryId === categoryId) {
                result.push(thread)
            }
        }

        return result
    }

    public async findByAuthorId(authorId: string): Promise<Thread[]> {
        const result: Thread[] = []

        for (const thread of this.threads.values()) {
            if (thread.authorId === authorId) {
                result.push(thread)
            }
        }

        return result
    }

    public async save(thread: Omit<Thread, 'id'>): Promise<Thread> {
        const id = `thread-${this.threads.size + 1}`
        const created: Thread = {
            id,
            ...thread,
        }

        this.threads.set(id, created)

        return created
    }

    public async saveWithInitialPost(): Promise<Thread> {
        throw new Error('Method not implemented')
    }

    public async update(id: string, data: Partial<Thread>): Promise<Thread> {
        const existing = this.threads.get(id)

        if (!existing) {
            throw new Error('Thread not found')
        }

        const updated: Thread = {
            ...existing,
            ...data,
        }

        this.threads.set(id, updated)

        return updated
    }

    public async delete(id: string): Promise<void> {
        this.threads.delete(id)
    }

    public async incrementViewCount(id: string): Promise<void> {
        const existing = this.threads.get(id)

        if (!existing) {
            return
        }

        const updated: Thread = {
            ...existing,
            viewCount: existing.viewCount + 1,
        }

        this.threads.set(id, updated)
    }

    public async updateLastPost(id: string, lastPostId: string): Promise<void> {
        const existing = this.threads.get(id)

        if (!existing) {
            return
        }

        const updated: Thread = {
            ...existing,
            lastPostId,
        }

        this.threads.set(id, updated)
    }
}

function createThread(props?: Partial<Thread>): Thread {
    const now = new Date().toISOString()

    return {
        id: props?.id ?? 'thread-1',
        categoryId: props?.categoryId ?? 'category-1',
        authorId: props?.authorId ?? 'author-1',
        title: props?.title ?? 'Example thread',
        slug: props?.slug ?? 'example-thread',
        isPinned: props?.isPinned ?? false,
        isLocked: props?.isLocked ?? false,
        viewCount: props?.viewCount ?? 0,
        replyCount: props?.replyCount ?? 0,
        lastPostId: props?.lastPostId ?? null,
        createdAt: props?.createdAt ?? now,
        updatedAt: props?.updatedAt ?? now,
    }
}

describe('ThreadDeleter', () => {
    it('deletes an existing thread when user is admin', async () => {
        const thread = createThread({ id: 'thread-1' })
        const repository = new InMemoryThreadRepository([thread])
        const deleter = new ThreadDeleter(repository)

        await deleter.execute({ threadId: thread.id, userRole: 'admin' })

        const found = await repository.findById(thread.id)
        expect(found).toBeNull()
    })

    it('throws NotFoundError when thread does not exist', async () => {
        const repository = new InMemoryThreadRepository([])
        const deleter = new ThreadDeleter(repository)

        await expect(
            deleter.execute({ threadId: 'non-existing', userRole: 'admin' }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('throws when user is not admin or moderator', async () => {
        const thread = createThread({ id: 'thread-1' })
        const repository = new InMemoryThreadRepository([thread])
        const deleter = new ThreadDeleter(repository)

        await expect(
            deleter.execute({ threadId: thread.id, userRole: 'user' }),
        ).rejects.toThrow('This action requires admin or moderator permissions')
    })
})
