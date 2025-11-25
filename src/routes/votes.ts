import type { Express } from 'express'

import { VotesController } from '@/app/features/votes/controllers/VotesController'
import { VoteRequest } from '@/app/features/votes/requests/VoteRequest'
import { VoteResource } from '@/app/features/votes/resources/VoteResource'
import { VoteService } from '@/app/features/votes/services/VoteService'
import type { ApplicationDependencies } from '@/routes/types'

export class VoteRoutes {
    private readonly controller: VotesController

    public constructor(dependencies: ApplicationDependencies) {
        const voteService = new VoteService(dependencies.database)
        this.controller = new VotesController(
            new VoteRequest(),
            new VoteResource(),
            voteService,
            dependencies.logger?.child({ context: 'VotesController' }),
        )
    }

    public map(server: Express): void {
        // Cast or update vote
        server.post('/api/posts/:postId/vote', (request, response, next) =>
            this.controller.vote(request, response, next),
        )

        // Remove vote
        server.delete('/api/posts/:postId/vote', (request, response, next) =>
            this.controller.removeVote(request, response, next),
        )

        // Get vote summary
        server.get('/api/posts/:postId/votes', (request, response, next) =>
            this.controller.getVoteSummary(request, response, next),
        )
    }
}
