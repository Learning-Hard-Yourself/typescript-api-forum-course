import express, { Express } from 'express'

import { registerRoutes } from '@/routes'

export class Application {
  private readonly server: Express

  public constructor() {
    this.server = express()
  }

  public async create(): Promise<Express> {
    this.configureMiddleware()
    registerRoutes(this.server)
    return this.server
  }

  private configureMiddleware(): void {
    this.server.use(express.json())
  }
}
