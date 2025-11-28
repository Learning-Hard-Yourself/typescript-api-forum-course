import type { NextFunction, Request, Response } from 'express'

import type { UserStatsService } from '@/app/features/users/services/UserStatsService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for getting user statistics.
 * GET /api/v1/users/:id/stats
 */
export class StatsUserController {
    public constructor(
        private readonly userStatsService: UserStatsService,
        private readonly logger?: Logger,
    ) {}

    public async handle(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const userId = request.params.id
            if (!userId) {
                response.status(400).json({ message: 'User ID is required' })
                return
            }

            const stats = await this.userStatsService.getUserStats(userId)

            this.logger?.info('User stats retrieved', { userId })
            response.status(200).json({ data: stats })
        } catch (error) {
            next(error)
        }
    }
}
