import type { AttachmentCreationAttributes } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import type { Attachment } from '@/types'
import type { AttachmentRepository } from '../repositories/AttachmentRepository'

export interface AttachmentCreatorInput {
    attributes: AttachmentCreationAttributes & { url: string }
}

export class AttachmentCreator {
    public constructor(private readonly attachmentRepository: AttachmentRepository) {}

    public async execute(input: AttachmentCreatorInput): Promise<Attachment> {
        const { attributes } = input

        return this.attachmentRepository.save({
            postId: attributes.postId,
            filename: attributes.filename,
            url: attributes.url,
            mimeType: attributes.mimeType,
            size: attributes.size,
            createdAt: new Date().toISOString(),
        })
    }
}
