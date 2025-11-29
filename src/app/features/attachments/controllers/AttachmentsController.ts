import type { NextFunction, Request, Response } from 'express'

import type { AttachmentCreationRequest } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import { AttachmentResource } from '@/app/features/attachments/resources/AttachmentResource'
import type { AttachmentCreator } from '@/app/features/attachments/use-cases/AttachmentCreator'
import { PresignedUrlGenerator } from '@/app/features/attachments/use-cases/PresignedUrlGenerator'
import { ValidationError } from '@/app/shared/errors/ValidationError'
import { headers } from '@/app/shared/http/ResponseHeaders'
import type { Logger } from '@/app/shared/logging/Logger'

export class AttachmentsController {
    private readonly presignedUrlGenerator = new PresignedUrlGenerator()

    public constructor(
        private readonly creationRequest: AttachmentCreationRequest,
        private readonly attachmentCreator: AttachmentCreator,
        private readonly logger?: Logger,
    ) {}

    public async sign(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { filename, mimeType } = request.body
            if (!filename || !mimeType) {
                throw new ValidationError([{ field: 'body', message: 'filename and mimeType are required' }])
            }

            const { url, key } = await this.presignedUrlGenerator.execute({ filename, mimeType })
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

            const attachment = await this.attachmentCreator.execute({ attributes: { ...attributes, url } })

            this.logger?.info('Attachment created', { attachmentId: attachment.id })

            headers(response)
                .location({ basePath: '/api/v1/attachments', resourceId: attachment.id })

            response.status(201).json(new AttachmentResource(attachment).toResponse())
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
