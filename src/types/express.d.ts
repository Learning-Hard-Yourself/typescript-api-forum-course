

import type { UserRole } from '@/app/features/users/models/User'
import type { SessionId, UserId } from '@/app/shared/types/branded'

declare global {
    namespace Express {
        
        interface Request {
            
            userId?: UserId

            
            userRole?: UserRole

            
            sessionId?: SessionId

            
            startTime?: number

            
            requestId?: string

            
            isAuthenticated?: boolean
        }

        
        interface Response {
            
            success?: <T>(data: T, statusCode?: number) => Response

            
            fail?: (message: string, statusCode?: number, details?: unknown) => Response
        }

        
        interface Application {
            
            startedAt?: Date

            
            version?: string
        }
    }
}

// This export is needed to make this a module
export { }

