import type { NextFunction, Request, Response } from 'express'

import { PermissionService } from '@/app/shared/services/PermissionService'
import type { ForumDatabase } from '@/config/database-types'

type ResourceType = 'post' | 'thread' | 'profile' | 'user'

/**
 * Require Ownership Middleware Factory
 * 
 * Creates middleware that verifies the user owns the resource or has moderator/admin privileges
 */
export function createRequireOwnership(database: ForumDatabase) {
    const permissionService = new PermissionService(database)

    return function requireOwnership(resourceType: ResourceType, idParam: string = 'id') {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' })
                return
            }

            const resourceId = req.params[idParam]
            if (!resourceId) {
                res.status(400).json({ message: 'Resource ID required' })
                return
            }

            let canAccess = false

            try {
                switch (resourceType) {
                    case 'post':
                        canAccess = await permissionService.canEditPost(req.user.id, resourceId)
                        break
                    case 'thread':
                        canAccess = await permissionService.canEditThread(req.user.id, resourceId)
                        break
                    case 'profile':
                        canAccess = await permissionService.canUpdateProfile(req.user.id, resourceId)
                        break
                    case 'user':
                        canAccess = await permissionService.canUpdateUser(req.user.id, resourceId)
                        break
                }

                if (!canAccess) {
                    res.status(403).json({
                        message: 'Forbidden: You do not have permission to access this resource'
                    })
                    return
                }

                next()
            } catch (error) {
                next(error)
            }
        }
    }
}
