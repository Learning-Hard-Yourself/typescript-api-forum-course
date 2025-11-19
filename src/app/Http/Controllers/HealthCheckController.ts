import { Request, Response } from 'express'

export class HealthCheckController {
  public handle(request: Request, response: Response): void {
    response.status(200).json({ status: 'ok' })
  }
}
