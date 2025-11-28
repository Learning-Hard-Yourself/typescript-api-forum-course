import type { Request, Response } from 'express'

import type { ForumDatabase } from '@/config/database-types'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
    }
  }
}

export class HealthCheckController {
  public constructor(private readonly database?: ForumDatabase) {}

  public async handle(_request: Request, response: Response): Promise<void> {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '1.0.0',
      checks: {
        database: {
          status: 'up',
        },
      },
    }

    // Check database connectivity if database is available
    if (this.database) {
      try {
        const dbStart = Date.now()
        // Simple query to verify database is responsive
        const { sql } = await import('drizzle-orm')
        await this.database.run(sql`SELECT 1`)
        healthStatus.checks.database.responseTime = Date.now() - dbStart
        healthStatus.checks.database.status = 'up'
      } catch {
        healthStatus.checks.database.status = 'down'
        healthStatus.status = 'degraded'
      }
    } else {
      // No database configured - still healthy, just can't check DB
      healthStatus.checks.database.status = 'up'
    }

    const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200
    response.status(statusCode).json(healthStatus)
  }
}
