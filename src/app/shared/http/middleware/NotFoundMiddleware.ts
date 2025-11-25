import type { Handler } from 'express'

export const createNotFoundMiddleware = (): Handler => {
  return (request, response) => {
    response.status(404).json({
      message: `Route ${request.method} ${request.originalUrl ?? request.url} was not found`,
    })
  }
}
