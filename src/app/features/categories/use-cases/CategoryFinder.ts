import { eq } from 'drizzle-orm'

import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { ForumDatabase } from '@/config/database-types'
import { categories } from '@/config/schema'
import type { Category } from '@/types'

export interface CategoryFinderInput {
    id: string
}

export class CategoryFinder {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(input: CategoryFinderInput): Promise<Category> {
        const [category] = await this.database
            .select()
            .from(categories)
            .where(eq(categories.id, input.id))
            .limit(1)

        if (!category) {
            throw new NotFoundError(`Category with ID ${input.id} not found`)
        }

        return category as Category
    }
}
