import { eq, isNull } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import type { ForumDatabase } from '@/config/database-types'
import { categories } from '@/config/schema'
import type { Category } from '@/types'
import type { CategoryRepository } from './CategoryRepository'

/**
 * Drizzle ORM implementation of CategoryRepository
 */
export class DrizzleCategoryRepository implements CategoryRepository {
    constructor(private readonly database: ForumDatabase) {}

    async findById(id: string): Promise<Category | null> {
        const [category] = await this.database
            .select()
            .from(categories)
            .where(eq(categories.id, id))
            .limit(1)

        return (category as Category) ?? null
    }

    async findBySlug(slug: string): Promise<Category | null> {
        const [category] = await this.database
            .select()
            .from(categories)
            .where(eq(categories.slug, slug))
            .limit(1)

        return (category as Category) ?? null
    }

    async findAll(): Promise<Category[]> {
        const result = await this.database.select().from(categories)
        return result as Category[]
    }

    async findByParentId(parentId: string | null): Promise<Category[]> {
        const result = await this.database
            .select()
            .from(categories)
            .where(parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId))

        return result as Category[]
    }

    async save(category: Omit<Category, 'id'>): Promise<Category> {
        const now = new Date().toISOString()
        const [created] = await this.database
            .insert(categories)
            .values({
                id: uuidv7(),
                ...category,
                createdAt: now,
                updatedAt: now,
            })
            .returning()

        return created as Category
    }

    async update(id: string, data: Partial<Category>): Promise<Category> {
        const [updated] = await this.database
            .update(categories)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(categories.id, id))
            .returning()

        return updated as Category
    }

    async delete(id: string): Promise<void> {
        await this.database.delete(categories).where(eq(categories.id, id))
    }
}
