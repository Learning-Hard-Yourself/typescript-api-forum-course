
import { ApplicationError } from './ApplicationError'

export { ConflictError } from './ConflictError'
export { NotFoundError } from './NotFoundError'
export { ValidationError } from './ValidationError'
export { ApplicationError }

export class ForbiddenError extends ApplicationError {
    public override readonly name = 'ForbiddenError'
    public override readonly statusCode = 403

    public constructor(message: string, context?: Record<string, unknown>) {
        super(message, context)
    }
}
