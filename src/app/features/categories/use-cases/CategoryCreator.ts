import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { CategoryCreationAttributes } from '@/app/features/categories/requests/CategoryCreationRequest'
import { ConflictError } from '@/app/shared/errors/ConflictError'
import type { ForumDatabase } from '@/config/database-types'
import { categories } from '@/config/schema'
import type { Category } from '@/types'

export interface CategoryCreatorInput {
    attributes: CategoryCreationAttributes
}

export class CategoryCreator {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: CategoryCreatorInput): Promise<Category> {
        const { attributes } = input

        const [existing] = await this.database
            .select()
            .from(categories)
            .where(eq(categories.slug, attributes.slug))
            .limit(1)

        if (existing) {
            throw new ConflictError('Category with this slug already exists', { slug: attributes.slug })
        }

        const id = uuidv7()
        const timestamp = new Date().toISOString()

        await this.database.insert(categories).values({
            id,
            ...attributes,
            createdAt: timestamp,
            updatedAt: timestamp,
        })

        const [record] = await this.database
            .select()
            .from(categories)
            .where(eq(categories.id, id))
            .limit(1)

        if (!record) {
            throw new Error('Category could not be created')
        }

        return record as Category
    }
}
