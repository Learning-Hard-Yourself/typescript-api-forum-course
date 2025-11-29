import type { Express } from 'express'

import { AttachmentsController } from '@/app/features/attachments/controllers/AttachmentsController'
import { DrizzleAttachmentRepository } from '@/app/features/attachments/repositories/DrizzleAttachmentRepository'
import { AttachmentCreationRequest } from '@/app/features/attachments/requests/AttachmentCreationRequest'
import { AttachmentCreator } from '@/app/features/attachments/use-cases/AttachmentCreator'
import type { ApplicationDependencies } from '@/routes/types'

export class AttachmentRoutes {
    private readonly controller: AttachmentsController

    public constructor(dependencies: ApplicationDependencies) {
        // Repository
        const attachmentRepository = new DrizzleAttachmentRepository(dependencies.database)

        // Use cases
        const attachmentCreator = new AttachmentCreator(attachmentRepository)

        this.controller = new AttachmentsController(
            new AttachmentCreationRequest(),
            attachmentCreator,
            dependencies.logger?.child({ context: 'AttachmentsController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/v1/attachments/sign', (request, response, next) => this.controller.sign(request, response, next))
        server.post('/api/v1/attachments', (request, response, next) => this.controller.store(request, response, next))
    }
}
