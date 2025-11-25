import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '@/app/shared/errors/ValidationError'
import type { AttachmentCreationRequest } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import type { AttachmentResource } from '@/app/features/attachments/resources/AttachmentResource'
import type { Logger } from '@/app/shared/logging/Logger'
import type { AttachmentService } from '@/app/features/attachments/services/AttachmentService'

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
