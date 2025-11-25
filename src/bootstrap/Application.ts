import express, { type Express } from 'express'

import { registerRoutes } from '@/routes'
import type { ApplicationDependencies } from '@/routes/types'
import { Logger } from '@/app/shared/logging/Logger'
import { createRequestLoggerMiddleware } from '@/app/shared/http/middleware/RequestLoggerMiddleware'
import { createNotFoundMiddleware } from '@/app/shared/http/middleware/NotFoundMiddleware'
import { createErrorHandlerMiddleware } from '@/app/shared/http/middleware/ErrorHandlerMiddleware'

export class Application {
  private readonly server: Express
  private readonly logger: Logger

  public constructor(private readonly dependencies: ApplicationDependencies) {
    this.server = express()
    this.logger = dependencies.logger ?? Logger.create({ name: 'forum-api' })
  }

  public async create(): Promise<Express> {
    this.configureMiddleware()
    registerRoutes(this.server, { ...this.dependencies, logger: this.logger })
    this.server.use(createNotFoundMiddleware())
    this.server.use(createErrorHandlerMiddleware(this.logger))
    return this.server
  }

  private configureMiddleware(): void {
    this.server.use(createRequestLoggerMiddleware(this.logger))
    this.server.use(express.json())
  }
}
