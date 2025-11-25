import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { AttachmentCreationAttributes } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import { attachments } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'
import type { Attachment } from '@/types'

export class AttachmentService {
    private readonly s3: S3Client
    private readonly bucket: string

    public constructor(private readonly database: ForumDatabase) {

        const accountId = process.env.R2_ACCOUNT_ID
        const accessKeyId = process.env.R2_ACCESS_KEY_ID
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
        this.bucket = process.env.R2_BUCKET_NAME ?? 'forum-attachments'

        if (!accountId || !accessKeyId || !secretAccessKey) {

            console.warn('R2 credentials not fully configured')
        }

        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId ?? '',
                secretAccessKey: secretAccessKey ?? '',
            },
        })
    }

    public async generatePresignedUrl(filename: string, mimeType: string): Promise<{ url: string; key: string }> {
        const key = `${uuidv7()}-${filename}`
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: mimeType,
        })

        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 })
        return { url, key }
    }

    public async create(attributes: AttachmentCreationAttributes & { url: string }): Promise<Attachment> {
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
