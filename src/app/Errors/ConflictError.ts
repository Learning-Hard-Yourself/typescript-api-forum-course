import { ApplicationError } from '@/app/Errors/ApplicationError'

export class ConflictError extends ApplicationError {
  public override readonly name = 'ConflictError'
  public override readonly statusCode = 409

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}
