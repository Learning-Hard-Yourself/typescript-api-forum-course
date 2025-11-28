import type { Express } from 'express'

import { HealthCheckController } from '@/app/features/health/controllers/HealthCheckController'
import type { ApplicationDependencies } from '@/routes/types'

export class HealthRoutes {
  private readonly controller: HealthCheckController

  public constructor(dependencies?: ApplicationDependencies) {
    this.controller = new HealthCheckController(dependencies?.database)
  }

  public map(server: Express): void {
    // Health check without versioning (best practice)
    server.get('/health', (request, response) => {
      this.controller.handle(request, response)
    })
    // Also available at versioned endpoint for backwards compatibility
    server.get('/api/v1/health', (request, response) => {
      this.controller.handle(request, response)
    })
  }
}
