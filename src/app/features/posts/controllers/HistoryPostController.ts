import type { NextFunction, Request, Response } from 'express'

import type { PostHistoryLister } from '@/app/features/posts/use-cases/PostHistoryLister'
import type { Logger } from '@/app/shared/logging/Logger'

export class HistoryPostController {
    public constructor(
        private readonly postHistoryLister: PostHistoryLister,
        private readonly logger?: Logger,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params

            if (!id) {
                res.status(400).json({ message: 'Post ID is required' })
                return
            }

            const history = await this.postHistoryLister.execute({ postId: id })

            this.logger?.info('Edit history retrieved', { postId: id, editCount: history.length })
            res.json({ data: history })
        } catch (error) {
            next(error)
        }
    }
}
