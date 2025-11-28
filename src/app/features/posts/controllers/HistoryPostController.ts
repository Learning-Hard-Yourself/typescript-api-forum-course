import type { NextFunction, Request, Response } from 'express'

import type { PostModerationService } from '@/app/features/posts/services/PostModerationService'
import type { Logger } from '@/app/shared/logging/Logger'

/**
 * Single Action Controller for getting post edit history.
 * GET /api/v1/posts/:id/history
 */
export class HistoryPostController {
    public constructor(
        private readonly moderationService: PostModerationService,
        private readonly logger?: Logger,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params

            if (!id) {
                res.status(400).json({ message: 'Post ID is required' })
                return
            }

            const history = await this.moderationService.getEditHistory(id)

            this.logger?.info('Edit history retrieved', { postId: id, editCount: history.length })
            res.json({ data: history })
        } catch (error) {
            next(error)
        }
    }
}
