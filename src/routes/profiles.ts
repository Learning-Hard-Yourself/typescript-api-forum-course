import type { Express } from 'express'

import { ProfilesController } from '@/app/features/profiles/controllers/ProfilesController'
import { DrizzleProfileRepository } from '@/app/features/profiles/repositories/DrizzleProfileRepository'
import { ProfileUpdateRequest } from '@/app/features/profiles/requests/ProfileUpdateRequest'
import { ProfileFinder } from '@/app/features/profiles/use-cases/ProfileFinder'
import { ProfileUpdater } from '@/app/features/profiles/use-cases/ProfileUpdater'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import { createRequireOwnership } from '@/app/shared/http/middleware/RequireOwnershipMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class ProfileRoutes {
    private readonly controller: ProfilesController
    private readonly requireOwnership: ReturnType<typeof createRequireOwnership>

    public constructor(dependencies: ApplicationDependencies) {
        const profileRepository = new DrizzleProfileRepository(dependencies.database)

        const profileFinder = new ProfileFinder(profileRepository)
        const profileUpdater = new ProfileUpdater(profileRepository)

        this.controller = new ProfilesController(
            new ProfileUpdateRequest(),
            profileFinder,
            profileUpdater,
            dependencies.logger?.child({ context: 'ProfilesController' }),
        )
        this.requireOwnership = createRequireOwnership(dependencies.database)
    }

    public map(server: Express): void {
        server.get('/api/v1/profiles/:userId', (request, response, next) => this.controller.show(request, response, next))
        server.patch('/api/v1/profiles/:userId', authMiddleware, this.requireOwnership('profile', 'userId'), (request, response, next) => this.controller.update(request, response, next))
    }
}
