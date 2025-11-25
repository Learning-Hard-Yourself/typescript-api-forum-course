import { eq } from 'drizzle-orm'

import type { ForumDatabase } from '@/config/database-types'
import { posts, threads, users } from '@/config/schema'

export class PermissionService {
    constructor(private readonly database: ForumDatabase) { }


    async isAdmin(userId: string): Promise<boolean> {
        const user = await this.database.query.users.findFirst({
            where: eq(users.id, userId),
        })
        return user?.role === 'admin'
    }


    async isModerator(userId: string): Promise<boolean> {
        const user = await this.database.query.users.findFirst({
            where: eq(users.id, userId),
        })
        return user?.role === 'moderator' || user?.role === 'admin'
    }


    async canEditPost(userId: string, postId: string): Promise<boolean> {
        const post = await this.database.query.posts.findFirst({
            where: eq(posts.id, postId),
        })

        if (!post) {
            return false
        }

        if (post.authorId === userId) {
            return true
        }

        return await this.isModerator(userId)
    }


    async canDeletePost(userId: string, postId: string): Promise<boolean> {
        return await this.canEditPost(userId, postId)
    }


    async canEditThread(userId: string, threadId: string): Promise<boolean> {
        const thread = await this.database.query.threads.findFirst({
            where: eq(threads.id, threadId),
        })

        if (!thread) {
            return false
        }

        if (thread.authorId === userId) {
            return true
        }

        return await this.isModerator(userId)
    }


    async canModerateThread(userId: string): Promise<boolean> {
        return await this.isModerator(userId)
    }


    async canUpdateProfile(userId: string, profileUserId: string): Promise<boolean> {
        if (userId === profileUserId) {
            return true
        }
        return await this.isAdmin(userId)
    }


    async canUpdateUser(userId: string, targetUserId: string): Promise<boolean> {
        if (userId === targetUserId) {
            return true
        }
        return await this.isAdmin(userId)
    }
}
