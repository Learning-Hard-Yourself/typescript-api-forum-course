import type { NextFunction, Request, Response } from 'express'

import { ApplicationError } from '@/app/shared/errors/ApplicationError'
import type { Logger } from '@/app/shared/logging/Logger'
import { ValidationError } from '@/app/shared/errors/ValidationError'

interface ErrorBody {
  readonly message: string
  readonly errors?: unknown
}

export const createErrorHandlerMiddleware = (logger: Logger) => {
  return (error: unknown, request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) {
      next(error)
      return
    }

    if (error instanceof ApplicationError) {
      logger.error(error.message, { ...error.context, path: request.path })
      const body: ErrorBody = {
        message: error.message,
      }

      if (error instanceof ValidationError) {
        body.errors = error.details
      }

      response.status(error.statusCode).json(body)
      return
    }

    logger.error('Unhandled error', { path: request.path, error })
    response.status(500).json({ message: 'Internal Server Error' })
  }
}
