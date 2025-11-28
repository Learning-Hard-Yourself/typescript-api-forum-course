import type { Express } from 'express'

import { VotesController } from '@/app/features/votes/controllers/VotesController'
import { VoteRequest } from '@/app/features/votes/requests/VoteRequest'
import { VoteCaster } from '@/app/features/votes/use-cases/VoteCaster'
import { VoteRemover } from '@/app/features/votes/use-cases/VoteRemover'
import { VoteRetriever } from '@/app/features/votes/use-cases/VoteRetriever'
import { authMiddleware } from '@/app/shared/http/middleware/AuthMiddleware'
import type { ApplicationDependencies } from '@/routes/types'

export class VoteRoutes {
    private readonly controller: VotesController

    public constructor(dependencies: ApplicationDependencies) {
        const voteCaster = new VoteCaster(dependencies.database)
        const voteRemover = new VoteRemover(dependencies.database)
        const voteRetriever = new VoteRetriever(dependencies.database)

        this.controller = new VotesController(
            new VoteRequest(),
            voteCaster,
            voteRemover,
            voteRetriever,
            dependencies.logger?.child({ context: 'VotesController' }),
        )
    }

    public map(server: Express): void {
        server.post('/api/v1/posts/:postId/vote', authMiddleware, (request, response, next) => this.controller.vote(request, response, next))
        server.delete('/api/v1/posts/:postId/vote', authMiddleware, (request, response, next) => this.controller.removeVote(request, response, next))
        server.get('/api/v1/posts/:postId/votes', (request, response, next) => this.controller.getVoteSummary(request, response, next))
    }
}
