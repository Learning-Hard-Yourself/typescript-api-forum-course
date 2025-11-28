import type { NextFunction, Request, Response } from 'express'

import type { VoteRequest } from '@/app/features/votes/requests/VoteRequest'
import { VoteResource } from '@/app/features/votes/resources/VoteResource'
import type { VoteCaster, VoteCasterError } from '@/app/features/votes/use-cases/VoteCaster'
import type { VoteRemover } from '@/app/features/votes/use-cases/VoteRemover'
import type { VoteRetriever } from '@/app/features/votes/use-cases/VoteRetriever'
import type { Logger } from '@/app/shared/logging/Logger'

export class VotesController {
    public constructor(
        private readonly voteRequest: VoteRequest,
        private readonly voteCaster: VoteCaster,
        private readonly voteRemover: VoteRemover,
        private readonly voteRetriever: VoteRetriever,
        private readonly logger?: Logger,
    ) {}

    public async vote(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string
            const userId = request.user!.id

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const validatedData = this.voteRequest.validate(request.body)

            const result = await this.voteCaster.execute({
                postId,
                userId,
                voteType: validatedData.voteType,
            })

            if (!result.ok) {
                this.handleVoteError(response, result.error)
                return
            }

            this.logger?.info('Vote cast successfully', {
                context: 'VotesController',
                postId,
                userId,
                voteType: validatedData.voteType,
            })

            response.status(200).json({
                data: {
                    vote: new VoteResource(result.value.vote).toArray(),
                    postScore: result.value.score,
                },
            })
        } catch (error: unknown) {
            next(error)
        }
    }

    private handleVoteError(response: Response, error: VoteCasterError): void {
        switch (error.code) {
            case 'POST_NOT_FOUND':
                response.status(404).json({ message: `Post with ID ${error.postId} not found` })
                break
            case 'DATABASE_ERROR':
                response.status(500).json({ message: error.message })
                break
        }
    }

    public async removeVote(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string
            const userId = request.user!.id

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const result = await this.voteRemover.execute({ postId, userId })

            if (!result.removed) {
                response.status(404).json({
                    message: 'No vote found to remove',
                })
                return
            }

            this.logger?.info('Vote removed successfully', {
                context: 'VotesController',
                postId,
                userId,
            })

            response.status(200).json({
                message: 'Vote removed',
                postScore: result.score,
            })
        } catch (error: unknown) {
            next(error)
        }
    }

    public async getVoteSummary(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const score = await this.voteRetriever.getVoteScore({ postId })

            response.status(200).json(VoteResource.scoreToJson(score))
        } catch (error: unknown) {
            next(error)
        }
    }
}
