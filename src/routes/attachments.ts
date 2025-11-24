import type { Express } from 'express'

import { AttachmentsController } from '@/app/Http/Controllers/AttachmentsController'
import { AttachmentCreationRequest } from '@/app/Http/Requests/AttachmentCreationRequest'
import { AttachmentResource } from '@/app/Http/Resources/AttachmentResource'
import { AttachmentService } from '@/app/Services/AttachmentService'
import type { ApplicationDependencies } from '@/routes/types'

export class AttachmentRoutes {
    private readonly controller: AttachmentsController

    public constructor(dependencies: ApplicationDependencies) {
        const attachmentService = new AttachmentService(dependencies.database)
        this.controller = new AttachmentsController(
            new AttachmentCreationRequest(),
            new AttachmentResource(),
            attachmentService,
            dependencies.logger?.child({ context: 'AttachmentsController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/attachments/sign', (request, response, next) => this.controller.sign(request, response, next))
        server.post('/api/attachments', (request, response, next) => this.controller.store(request, response, next))
    }
}
