import { APIError } from 'better-call'
import type { Express, NextFunction, Request, Response } from 'express'

import { GetCurrentUser } from '@/app/features/auth/use-cases/GetCurrentUser'
import { LoginUser } from '@/app/features/auth/use-cases/LoginUser'
import { LogoutUser } from '@/app/features/auth/use-cases/LogoutUser'
import { RegisterUser } from '@/app/features/auth/use-cases/RegisterUser'
import { initAuth } from '@/config/auth'
import type { ApplicationDependencies } from '@/routes/types'

export class AuthRoutes {
  private readonly registerUser: RegisterUser
  private readonly loginUser: LoginUser
  private readonly getCurrentUser: GetCurrentUser
  private readonly logoutUser: LogoutUser

  public constructor(private readonly dependencies: ApplicationDependencies) {
    const auth = initAuth(dependencies)

    this.registerUser = new RegisterUser(auth, dependencies.database)
    this.loginUser = new LoginUser(auth, dependencies.database)
    this.getCurrentUser = new GetCurrentUser(auth, dependencies.database)
    this.logoutUser = new LogoutUser(auth)
  }

  public map(server: Express): void {
    // Register endpoint
    server.post('/api/v1/auth/register', async (request: Request, response: Response, next: NextFunction) => {
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

    // Login endpoint
    server.post('/api/v1/auth/login', async (request: Request, response: Response, next: NextFunction) => {
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

    // Get session endpoint
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

    // Logout endpoint
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
