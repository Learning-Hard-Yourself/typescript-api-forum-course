import type { Post } from '@/types'

/**
 * Repository interface for Post entity
 */
export interface PostRepository {
    findById(id: string): Promise<Post | null>
    findByThreadId(threadId: string): Promise<Post[]>
    save(post: Omit<Post, 'id'>): Promise<Post>
    update(id: string, post: Partial<Post>): Promise<Post>
    delete(id: string): Promise<void>
}
