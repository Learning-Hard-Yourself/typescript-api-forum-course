import type { NextFunction, Request, Response } from 'express'

/**
 * Require Role Middleware
 * 
 * Verifies that the authenticated user has the required role
 */
export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                required: role,
                current: req.user.role
            })
            return
        }

        next()
    }
}

/**
 * Require Any Role Middleware
 * 
 * Verifies that the authenticated user has at least one of the required roles
 */
export function requireAnyRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        // Admin always has access
        if (req.user.role === 'admin') {
            next()
            return
        }

        const userRole = req.user.role ?? 'user'
        if (!roles.includes(userRole)) {
            res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                required: roles,
                current: userRole
            })
            return
        }

        next()
    }
}
