/**
 * Centralized error exports
 */

// Import base error first
import { ApplicationError } from './ApplicationError'

// Export all errors
export { ConflictError } from './ConflictError'
export { NotFoundError } from './NotFoundError'
export { ValidationError } from './ValidationError'
export { ApplicationError }

/**
 * ForbiddenError for permission-related issues
 */
export class ForbiddenError extends ApplicationError {
    public override readonly name = 'ForbiddenError'
    public override readonly statusCode = 403

    public constructor(message: string, context?: Record<string, unknown>) {
        super(message, context)
    }
}
