import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ThreadCreationAttributes } from '@/app/Http/Requests/ThreadCreationRequest'
import { UserService } from '@/app/Services/UserService'
import { posts, threads } from '@/database/schema'
import type { Thread } from '@/types'

export class ThreadService extends UserService {
    public constructor(database: UserService['database']) {
        super(database)
    }

    public async create(authorId: string, attributes: ThreadCreationAttributes): Promise<Thread> {
        const threadId = uuidv7()
        const postId = uuidv7()
        const timestamp = new Date().toISOString()

        // Transaction to ensure thread and initial post are created together
        this.database.transaction((tx: any) => {
            // 1. Create Thread (initially with null lastPostId to avoid FK violation)
            tx.insert(threads).values({
                id: threadId,
                categoryId: attributes.categoryId,
                authorId,
                title: attributes.title,
                slug: attributes.slug ?? this.generateSlug(attributes.title),
                isPinned: false,
                isLocked: false,
                viewCount: 0,
                replyCount: 0,
                lastPostId: null, // Set to null initially
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            // 2. Create Initial Post
            tx.insert(posts).values({
                id: postId,
                threadId,
                parentPostId: null,
                authorId,
                content: attributes.content,
                voteScore: 0,
                isEdited: false,
                isDeleted: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            }).run()

            // 3. Update Thread with lastPostId
            tx.update(threads).set({ lastPostId: postId }).where(eq(threads.id, threadId)).run()
        })

        const [record] = await this.database
            .select()
            .from(threads)
            .where(eq(threads.id, threadId))
            .limit(1)

        if (!record) {
            throw new Error('Thread could not be created')
        }

        return record as Thread
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }
}
