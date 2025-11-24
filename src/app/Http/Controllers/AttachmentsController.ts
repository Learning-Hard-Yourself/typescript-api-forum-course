import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '@/app/Errors/ValidationError'
import type { AttachmentCreationRequest } from '@/app/Http/Requests/AttachmentCreationRequest'
import type { AttachmentResource } from '@/app/Http/Resources/AttachmentResource'
import type { Logger } from '@/app/Logging/Logger'
import type { AttachmentService } from '@/app/Services/AttachmentService'

export class AttachmentsController {
    public constructor(
        private readonly creationRequest: AttachmentCreationRequest,
        private readonly attachmentResource: AttachmentResource,
        private readonly attachmentService: AttachmentService,
        private readonly logger?: Logger,
    ) { }

    public async sign(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { filename, mimeType } = request.body
            if (!filename || !mimeType) {
                throw new ValidationError([{ field: 'body', message: 'filename and mimeType are required' }])
            }

            const { url, key } = await this.attachmentService.generatePresignedUrl(filename, mimeType)
            response.status(200).json({ url, key })
        } catch (error) {
            this.logger?.error(error as Error)
            next(error)
        }
    }

    public async store(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const attributes = this.creationRequest.validate(request.body)
            // In a real app, we might verify the file was actually uploaded to R2 using the key/url
            // For now, we trust the client provided the correct URL (or we construct it from key if we passed key back)
            // Let's assume the client sends the full public URL or we construct it.
            // The service expects { url } in attributes.
            // But `AttachmentCreationRequest` doesn't validate `url`.
            // We should probably add `url` or `key` to the request schema or handle it here.
            // Let's assume the client sends `url` in the body, but `AttachmentCreationRequest` only validates metadata.
            // I'll update `AttachmentCreationRequest` or just cast/validate here.

            const url = request.body.url
            if (!url) {
                throw new ValidationError([{ field: 'url', message: 'URL is required' }])
            }

            const attachment = await this.attachmentService.create({ ...attributes, url })
            const data = this.attachmentResource.toResponse(attachment)
            this.logger?.info('Attachment created', { attachmentId: attachment.id })
            response.status(201).json({ data })
        } catch (error) {
            if (error instanceof ValidationError) {
                this.logger?.warn('Validation failed on attachment creation', { errors: error.details })
            } else {
                this.logger?.error(error as Error)
            }
            next(error)
        }
    }
}
