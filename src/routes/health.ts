import type { Express } from 'express'

import { HealthCheckController } from '@/app/features/health/controllers/HealthCheckController'
import type { ApplicationDependencies } from '@/routes/types'

export class HealthRoutes {
  private readonly controller: HealthCheckController

  public constructor(dependencies?: ApplicationDependencies) {
    this.controller = new HealthCheckController(dependencies?.database)
  }

  public map(server: Express): void {
    server.get('/api/v1/health', (request, response) => {
      this.controller.handle(request, response)
    })
  }
}
