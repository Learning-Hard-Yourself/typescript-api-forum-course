import type { Express } from 'express'

import { ProfilesController } from '@/app/features/profiles/controllers/ProfilesController'
import { ProfileUpdateRequest } from '@/app/features/profiles/requests/ProfileUpdateRequest'
import { ProfileResource } from '@/app/features/profiles/resources/ProfileResource'
import { ProfileService } from '@/app/features/profiles/services/ProfileService'
import type { ApplicationDependencies } from '@/routes/types'

export class ProfileRoutes {
    private readonly controller: ProfilesController

    public constructor(dependencies: ApplicationDependencies) {
        const profileService = new ProfileService(dependencies.database)
        this.controller = new ProfilesController(
            new ProfileUpdateRequest(),
            new ProfileResource(),
            profileService,
            dependencies.logger?.child({ context: 'ProfilesController' }),
        )
    }

    public map(server: Express): void {
        server.get('/api/profiles/:userId', (request, response, next) => this.controller.show(request, response, next))
        server.patch('/api/profiles/:userId', (request, response, next) => this.controller.update(request, response, next))
    }
}
