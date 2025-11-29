import type { Thread } from '@/types'

export interface ThreadCreationData {
    categoryId: string
    authorId: string
    title: string
    slug: string
    content: string
}


export interface ThreadRepository {
    findById(id: string): Promise<Thread | null>
    findBySlug(slug: string): Promise<Thread | null>
    findByCategoryId(categoryId: string): Promise<Thread[]>
    findByAuthorId(authorId: string): Promise<Thread[]>
    save(thread: Omit<Thread, 'id'>): Promise<Thread>
    saveWithInitialPost(data: ThreadCreationData): Promise<Thread>
    update(id: string, thread: Partial<Thread>): Promise<Thread>
    delete(id: string): Promise<void>
    incrementViewCount(id: string): Promise<void>
    updateLastPost(id: string, lastPostId: string): Promise<void>
}
