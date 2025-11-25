import { eq } from 'drizzle-orm'

import type { ForumDatabase } from '@/config/database-types'
import { posts, threads, users } from '@/config/schema'

/**
 * Permission Service
 * 
 * Centralized service for checking user permissions and roles
 */
export class PermissionService {
    constructor(private readonly database: ForumDatabase) { }

    /**
     * Check if user is an admin
     */
    async isAdmin(userId: string): Promise<boolean> {
        const user = await this.database.query.users.findFirst({
            where: eq(users.id, userId),
        })
        return user?.role === 'admin'
    }

    /**
     * Check if user is a moderator or admin
     */
    async isModerator(userId: string): Promise<boolean> {
        const user = await this.database.query.users.findFirst({
            where: eq(users.id, userId),
        })
        return user?.role === 'moderator' || user?.role === 'admin'
    }

    /**
     * Check if user can edit a post
     * - User must be the author, OR
     * - User must be a moderator/admin
     */
    async canEditPost(userId: string, postId: string): Promise<boolean> {
        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            return false
        }

        // Check if user is the author
        if (post.authorId === userId) {
            return true
        }

        // Check if user is moderator/admin
        return await this.isModerator(userId)
    }

    /**
     * Check if user can delete a post
     * - User must be the author, OR
     * - User must be a moderator/admin
     */
    async canDeletePost(userId: string, postId: string): Promise<boolean> {
        return await this.canEditPost(userId, postId)
    }

    /**
     * Check if user can edit a thread
     * - User must be the author, OR
     * - User must be a moderator/admin
     */
    async canEditThread(userId: string, threadId: string): Promise<boolean> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            return false
        }

        // Check if user is the author
        if (thread.authorId === userId) {
            return true
        }

        // Check if user is moderator/admin
        return await this.isModerator(userId)
    }

    /**
     * Check if user can moderate threads (pin, lock, etc.)
     * - User must be a moderator/admin
     */
    async canModerateThread(userId: string): Promise<boolean> {
        return await this.isModerator(userId)
    }

    /**
     * Check if user can update another user's profile
     * - User must be updating their own profile, OR
     * - User must be an admin
     */
    async canUpdateProfile(userId: string, profileUserId: string): Promise<boolean> {
        if (userId === profileUserId) {
            return true
        }
        return await this.isAdmin(userId)
    }

    /**
     * Check if user can update another user's account
     * - User must be updating their own account, OR
     * - User must be an admin
     */
    async canUpdateUser(userId: string, targetUserId: string): Promise<boolean> {
        if (userId === targetUserId) {
            return true
        }
        return await this.isAdmin(userId)
    }
}
