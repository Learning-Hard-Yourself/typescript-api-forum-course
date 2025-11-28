import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Attachment } from '@/types'

export interface AttachmentOutput {
    id: string
    postId: string
    filename: string
    url: string
    mimeType: string
    size: number
    createdAt: string
}

export class AttachmentResource extends JsonResource<Attachment, AttachmentOutput> {
    toArray(): AttachmentOutput {
        return {
            id: this.resource.id,
            postId: this.resource.postId,
            filename: this.resource.filename,
            url: this.resource.url,
            mimeType: this.resource.mimeType,
            size: this.resource.size,
            createdAt: this.resource.createdAt,
        }
    }
}
