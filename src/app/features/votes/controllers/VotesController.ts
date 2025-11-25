/**
 * Votes Controller - HTTP request handling for voting
 *
 * Demonstrates:
 * - Express types and request handling
 * - Async error handling
 * - Response formatting
 */

import type { Logger } from '@/app/shared/logging/Logger'
import type { NextFunction, Request, Response } from 'express'

import { VoteRequest } from '@/app/features/votes/requests/VoteRequest'
import { VoteResource } from '@/app/features/votes/resources/VoteResource'
import { VoteService } from '@/app/features/votes/services/VoteService'

export class VotesController {
    public constructor(
        private readonly voteRequest: VoteRequest,
        private readonly voteResource: VoteResource,
        private readonly voteService: VoteService,
        private readonly logger?: Logger,
    ) { }

    /**
     * Cast or update a vote on a post
     * POST /api/posts/:postId/vote
     */
    public async vote(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string
            const userId = request.params.userId ?? 'anonymous' // TODO: Get from auth

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const validatedData = this.voteRequest.validate(request.body)

            const result = await this.voteService.castVote(postId, userId, validatedData.voteType)

            this.logger?.info('Vote cast successfully', {
                context: 'VotesController',
                postId,
                userId,
                voteType: validatedData.voteType,
            })

            response.status(200).json({
                vote: this.voteResource.toJson(result.vote),
                postScore: result.score,
            })
        } catch (error: unknown) {
            next(error)
        }
    }

    /**
     * Remove a vote from a post
     * DELETE /api/posts/:postId/vote
     */
    public async removeVote(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string
            const userId = request.params.userId ?? 'anonymous' // TODO: Get from auth

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const result = await this.voteService.removeVote(postId, userId)

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

    /**
     * Get vote summary for a post
     * GET /api/posts/:postId/votes
     */
    public async getVoteSummary(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const postId = request.params.postId as string

            if (!postId) {
                response.status(400).json({ message: 'Post ID is required' })
                return
            }

            const score = await this.voteService.getVoteScore(postId)

            response.status(200).json(this.voteResource.scoreToJson(score))
        } catch (error: unknown) {
            next(error)
        }
    }
}
