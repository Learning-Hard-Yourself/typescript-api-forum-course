import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { postEdits } from '@/config/schema'
import type { PostEdit, PostEditRepository } from './PostEditRepository'

/**
 * Drizzle ORM implementation of PostEditRepository
 */
export class DrizzlePostEditRepository implements PostEditRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findByPostId(postId: string): Promise<PostEdit[]> {
        const result = await this.database
            .select()
            .from(postEdits)
            .where(eq(postEdits.postId, postId))

        return result as PostEdit[]
    }

    async save(edit: Omit<PostEdit, 'id'>): Promise<PostEdit> {
        const [created] = await this.database
            .insert(postEdits)
            .values({
                id: uuidv7(),
                ...edit,
            })
            .returning()

        return created as PostEdit
    }
}
