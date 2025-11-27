/**
 * Module Augmentation for Express.
 * 
 * TypeScript Concept: Module Augmentation / Declaration Merging
 * - Allows extending types from external libraries
 * - Uses 'declare module' to merge with existing declarations
 * - The added properties become available globally for that module
 * - No runtime code - purely type-level augmentation
 */

import type { UserRole } from '@/app/features/users/models/User'
import type { SessionId, UserId } from '@/app/shared/types/branded'

declare global {
    namespace Express {
        /**
         * Augment Express Request interface with auth properties
         */
        interface Request {
            /**
             * The authenticated user's ID (set by AuthMiddleware)
             */
            userId?: UserId

            /**
             * The authenticated user's role (set by AuthMiddleware)
             */
            userRole?: UserRole

            /**
             * The current session ID (set by AuthMiddleware)
             */
            sessionId?: SessionId

            /**
             * Request start time for timing (set by LoggingMiddleware)
             */
            startTime?: number

            /**
             * Request ID for tracing (set by RequestIdMiddleware)
             */
            requestId?: string

            /**
             * Indicates if the request is from an authenticated user
             */
            isAuthenticated?: boolean
        }

        /**
         * Augment Express Response interface with custom methods
         */
        interface Response {
            /**
             * Custom success response helper
             */
            success?: <T>(data: T, statusCode?: number) => Response

            /**
             * Custom error response helper
             */
            fail?: (message: string, statusCode?: number, details?: unknown) => Response
        }

        /**
         * Augment Express Application interface
         */
        interface Application {
            /**
             * Application startup time
             */
            startedAt?: Date

            /**
             * Application version
             */
            version?: string
        }
    }
}

// This export is needed to make this a module
export { }

