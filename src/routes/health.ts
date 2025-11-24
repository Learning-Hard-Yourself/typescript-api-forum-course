import type { Express } from 'express'

import { HealthCheckController } from '@/app/Http/Controllers/HealthCheckController'

export class HealthRoutes {
  private readonly controller: HealthCheckController

  public constructor() {
    this.controller = new HealthCheckController()
  }

  public map(server: Express): void {
    server.get('/api/health', (request, response) => {
      this.controller.handle(request, response)
    })
  }
}
