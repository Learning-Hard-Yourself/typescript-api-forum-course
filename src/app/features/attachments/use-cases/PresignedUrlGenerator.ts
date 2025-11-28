import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v7 as uuidv7 } from 'uuid'

export interface PresignedUrlGeneratorInput {
    filename: string
    mimeType: string
}

export interface PresignedUrlResult {
    url: string
    key: string
}

/**
 * Use case for generating presigned URLs for file uploads.
 */
export class PresignedUrlGenerator {
    private readonly s3: S3Client
    private readonly bucket: string

    public constructor() {
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

    public async execute(input: PresignedUrlGeneratorInput): Promise<PresignedUrlResult> {
        const key = `${uuidv7()}-${input.filename}`
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: input.mimeType,
        })

        const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 })
        return { url, key }
    }
}
