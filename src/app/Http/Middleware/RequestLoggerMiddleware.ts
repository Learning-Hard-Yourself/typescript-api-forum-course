import type { Handler, NextFunction, Request, Response } from 'express'

import type { Logger } from '@/app/Logging/Logger'

export const createRequestLoggerMiddleware = (logger: Logger): Handler => {
  return (request: Request, response: Response, next: NextFunction) => {
    const start = performance.now()

    response.on('finish', () => {
      const duration = Number((performance.now() - start).toFixed(2))
      const baseContext = {
        method: request.method,
        url: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs: duration,
      }

      if (response.statusCode >= 500) {
        logger.error('HTTP request failed', baseContext)
        return
      }

      if (response.statusCode >= 400) {
        logger.warn('HTTP request returned client error', baseContext)
        return
      }

      logger.info('HTTP request completed', baseContext)
    })

    next()
  }
}
