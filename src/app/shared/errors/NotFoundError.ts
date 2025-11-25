import { ApplicationError } from '@/app/shared/errors/ApplicationError'

export class NotFoundError extends ApplicationError {
  public override readonly name = 'NotFoundError'
  public override readonly statusCode = 404

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}
