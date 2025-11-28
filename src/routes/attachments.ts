import type { Express } from 'express'

import { AttachmentsController } from '@/app/features/attachments/controllers/AttachmentsController'
import { AttachmentCreationRequest } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import { AttachmentResource } from '@/app/features/attachments/resources/AttachmentResource'
import { AttachmentCreator } from '@/app/features/attachments/use-cases/AttachmentCreator'
import type { ApplicationDependencies } from '@/routes/types'

export class AttachmentRoutes {
    private readonly controller: AttachmentsController

    public constructor(dependencies: ApplicationDependencies) {
        const attachmentCreator = new AttachmentCreator(dependencies.database)

        this.controller = new AttachmentsController(
            new AttachmentCreationRequest(),
            new AttachmentResource(),
            attachmentCreator,
            dependencies.logger?.child({ context: 'AttachmentsController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/v1/attachments/sign', (request, response, next) => this.controller.sign(request, response, next))
        server.post('/api/v1/attachments', (request, response, next) => this.controller.store(request, response, next))
    }
}
