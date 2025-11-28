import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { attachments } from '@/config/schema'
import type { Attachment } from '@/types'
import type { AttachmentRepository } from './AttachmentRepository'

/**
 * Drizzle ORM implementation of AttachmentRepository
 */
export class DrizzleAttachmentRepository implements AttachmentRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Attachment | null> {
        const [attachment] = await this.database
            .select()
            .from(attachments)
            .where(eq(attachments.id, id))
            .limit(1)

        return (attachment as Attachment) ?? null
    }

    async findByPostId(postId: string): Promise<Attachment[]> {
        const result = await this.database
            .select()
            .from(attachments)
            .where(eq(attachments.postId, postId))

        return result as Attachment[]
    }

    async save(attachment: Omit<Attachment, 'id'>): Promise<Attachment> {
        const [created] = await this.database
            .insert(attachments)
            .values({
                id: uuidv7(),
                ...attachment,
                createdAt: new Date().toISOString(),
            })
            .returning()

        return created as Attachment
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(attachments).where(eq(attachments.id, id))
    }

    async deleteByPostId(postId: string): Promise<void> {
        await this.database.delete(attachments).where(eq(attachments.postId, postId))
    }
}
