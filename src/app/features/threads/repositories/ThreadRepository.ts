import type { Thread } from '@/types'

/**
 * Repository interface for Thread entity
 */
export interface ThreadRepository {
    findById(id: string): Promise<Thread | null>
    findBySlug(slug: string): Promise<Thread | null>
    findByCategoryId(categoryId: string): Promise<Thread[]>
    findByAuthorId(authorId: string): Promise<Thread[]>
    save(thread: Omit<Thread, 'id'>): Promise<Thread>
    update(id: string, thread: Partial<Thread>): Promise<Thread>
    delete(id: string): Promise<void>
    incrementViewCount(id: string): Promise<void>
    updateLastPost(id: string, lastPostId: string): Promise<void>
}
