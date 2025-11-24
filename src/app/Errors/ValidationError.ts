import { ApplicationError } from '@/app/Errors/ApplicationError'

export interface ValidationErrorDetail {
  readonly field: string
  readonly message: string
}

export class ValidationError extends ApplicationError {
  public override readonly name = 'ValidationError'
  public override readonly statusCode = 422

  public constructor(public readonly details: ValidationErrorDetail[]) {
    super('Validation failed', { details })
  }
}
