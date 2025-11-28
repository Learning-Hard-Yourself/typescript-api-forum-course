import type { Attachment } from '@/types'

/**
 * Repository interface for Attachment entity
 */
export interface AttachmentRepository {
    findById(id: string): Promise<Attachment | null>
    findByPostId(postId: string): Promise<Attachment[]>
    save(attachment: Omit<Attachment, 'id'>): Promise<Attachment>
    delete(id: string): Promise<void>
    deleteByPostId(postId: string): Promise<void>
}
