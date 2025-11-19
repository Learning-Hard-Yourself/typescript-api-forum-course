import { Express } from 'express'

import { HealthRoutes } from '@/routes/health'

export const registerRoutes = (server: Express): void => {
  const healthRoutes = new HealthRoutes()
  healthRoutes.map(server)
}
