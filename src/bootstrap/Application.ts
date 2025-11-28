import compression from 'compression'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'

import { createContentTypeMiddleware } from '@/app/shared/http/middleware/ContentTypeMiddleware'
import { createErrorHandlerMiddleware } from '@/app/shared/http/middleware/ErrorHandlerMiddleware'
import { createNotFoundMiddleware } from '@/app/shared/http/middleware/NotFoundMiddleware'
import { requestIdMiddleware } from '@/app/shared/http/middleware/RequestIdMiddleware'
import { createRequestLoggerMiddleware } from '@/app/shared/http/middleware/RequestLoggerMiddleware'
import { ConsoleLogger, type Logger } from '@/app/shared/logging/Logger'
import { registerRoutes } from '@/routes'
import type { ApplicationDependencies } from '@/routes/types'

/**
 * Allowed origins for CORS
 */
const CORS_OPTIONS: cors.CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-Id',
    'Location',
    'ETag',
    'Last-Modified',
    'Cache-Control',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
}

export class Application {
  private readonly server: Express
  private readonly logger: Logger

  public constructor(private readonly dependencies: ApplicationDependencies) {
    this.server = express()
    this.logger = dependencies.logger ?? ConsoleLogger.create({ name: 'forum-api' })
  }

  public async create(): Promise<Express> {
    this.configureSecurityMiddleware()
    this.configureMiddleware()
    registerRoutes(this.server, { ...this.dependencies, logger: this.logger })
    this.server.use(createNotFoundMiddleware())
    this.server.use(createErrorHandlerMiddleware(this.logger))
    return this.server
  }

  /**
   * Security middleware configuration
   */
  private configureSecurityMiddleware(): void {
    // Helmet for security headers
    this.server.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }))

    // CORS configuration
    this.server.use(cors(CORS_OPTIONS))

    // Compression for responses
    this.server.use(compression())
  }

  private configureMiddleware(): void {
    this.server.use(requestIdMiddleware())
    this.server.use(createRequestLoggerMiddleware(this.logger))
    this.server.use(express.json({ limit: '10mb' }))
    this.server.use(express.urlencoded({ extended: true, limit: '10mb' }))
    this.server.use(createContentTypeMiddleware())
  }
}
