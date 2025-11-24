import type { Attachment } from '@/types'

export class AttachmentResource {
    public toResponse(attachment: Attachment): Attachment {
        return attachment
    }
}
