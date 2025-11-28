import { getAuth } from '@/config/auth'
import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                emailVerified: boolean
                name: string
                createdAt: Date
                updatedAt: Date
                image?: string | null | undefined
                jti?: string | null | undefined
                role?: string | null | undefined
                lastActiveAt?: string | null | undefined
            }
            session?: {
                id: string
                userId: string
                expiresAt: Date
                ipAddress?: string | null | undefined
                userAgent?: string | null | undefined
            }
        }
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = getAuth()
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        })

        if (!session) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        req.user = session.user
        req.session = session.session
        next()
    } catch (error) {
        next(error)
    }
}
