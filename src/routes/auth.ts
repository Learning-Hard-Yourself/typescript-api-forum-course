import { APIError } from 'better-call'
import type { Express, NextFunction, Request, Response } from 'express'

import { GetCurrentUser } from '@/app/features/auth/use-cases/GetCurrentUser'
import { LoginUser } from '@/app/features/auth/use-cases/LoginUser'
import { LogoutUser } from '@/app/features/auth/use-cases/LogoutUser'
import { RefreshToken } from '@/app/features/auth/use-cases/RefreshToken'
import { RegisterUser } from '@/app/features/auth/use-cases/RegisterUser'
import { rateLimiters } from '@/app/shared/http/middleware/RateLimitMiddleware'
import { initAuth } from '@/config/auth'
import type { ApplicationDependencies } from '@/routes/types'

export class AuthRoutes {
  private readonly registerUser: RegisterUser
  private readonly loginUser: LoginUser
  private readonly getCurrentUser: GetCurrentUser
  private readonly logoutUser: LogoutUser
  private readonly refreshToken: RefreshToken

  public constructor(private readonly dependencies: ApplicationDependencies) {
    const auth = initAuth(dependencies)

    this.registerUser = new RegisterUser(auth, dependencies.database)
    this.loginUser = new LoginUser(auth, dependencies.database)
    this.getCurrentUser = new GetCurrentUser(auth, dependencies.database)
    this.logoutUser = new LogoutUser(auth)
    this.refreshToken = new RefreshToken(auth)
  }

  public map(server: Express): void {

    server.post('/api/v1/auth/register', rateLimiters.auth, async (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = await this.registerUser.execute(request, response, request.body)
        response.status(201).json({ data: result })
      } catch (error: any) {
        if (error instanceof APIError && error.code === 'UNPROCESSABLE_ENTITY') {
          return response.status(409).json({
            message: 'User with provided email or username already exists',
          })
        }
        if (error.message === 'User with provided email or username already exists') {
          return response.status(409).json({ message: error.message })
        }
        next(error)
      }
    })

    server.post('/api/v1/auth/login', rateLimiters.auth, async (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = await this.loginUser.execute(request, response, request.body)
        response.status(200).json({ data: result })
      } catch (error: any) {
        if (error instanceof APIError && error.code === 'UNAUTHORIZED') {
          return response.status(401).json({ message: 'Invalid credentials' })
        }
        if (error.message === 'Invalid credentials') {
          return response.status(401).json({ message: error.message })
        }
        next(error)
      }
    })

    server.get('/api/v1/auth/me', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = await this.getCurrentUser.execute(request)
        response.status(200).json({ data: result })
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return response.status(401).json({ message: 'Unauthorized' })
        }
        next(error)
      }
    })

    server.post('/api/v1/auth/refresh', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = await this.refreshToken.execute(request, response)
        response.status(200).json({ data: result })
      } catch (error: any) {
        if (error.message === 'Session expired' || error.message === 'Failed to refresh access token') {
          return response.status(401).json({ message: 'Session expired' })
        }
        next(error)
      }
    })

    server.post('/api/v1/auth/logout', async (request: Request, response: Response, next: NextFunction) => {
      try {
        await this.logoutUser.execute(request, response)
        response.status(204).send()
      } catch (error: any) {
        next(error)
      }
    })
  }
}
