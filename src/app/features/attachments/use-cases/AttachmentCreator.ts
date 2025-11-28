import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { AttachmentCreationAttributes } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import type { ForumDatabase } from '@/config/database-types'
import { attachments } from '@/config/schema'
import type { Attachment } from '@/types'

export interface AttachmentCreatorInput {
    attributes: AttachmentCreationAttributes & { url: string }
}

/**
 * Use case for creating an attachment record.
 */
export class AttachmentCreator {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: AttachmentCreatorInput): Promise<Attachment> {
        const { attributes } = input
        const id = uuidv7()
        const timestamp = new Date().toISOString()

        await this.database.insert(attachments).values({
            id,
            postId: attributes.postId,
            filename: attributes.filename,
            url: attributes.url,
            mimeType: attributes.mimeType,
            size: attributes.size,
            createdAt: timestamp,
        })

        const [record] = await this.database
            .select()
            .from(attachments)
            .where(eq(attachments.id, id))
            .limit(1)

        if (!record) {
            throw new Error('Attachment could not be created')
        }

        return record as Attachment
    }
}
