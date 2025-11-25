import { asc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { ConflictError } from '@/app/shared/errors/ConflictError'
import type { CategoryCreationAttributes } from '@/app/features/categories/requests/CategoryCreationRequest'
import { categories } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'
import type { Category } from '@/types'

export class CategoryService {
    public constructor(private readonly database: ForumDatabase) { }

    public async create(attributes: CategoryCreationAttributes): Promise<Category> {
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

    public async getAll(): Promise<Category[]> {
        const allCategories = await this.database
            .select()
            .from(categories)
            .orderBy(asc(categories.order))

        const categoryMap = new Map<string, Category & { children: Category[] }>()
        const roots: (Category & { children: Category[] })[] = []

        for (const cat of allCategories) {
            categoryMap.set(cat.id, { ...(cat as Category), children: [] })
        }

        for (const cat of allCategories) {
            const node = categoryMap.get(cat.id)!
            if (cat.parentId && categoryMap.has(cat.parentId)) {
                categoryMap.get(cat.parentId)!.children.push(node)
            } else {
                roots.push(node)
            }
        }

        return roots
    }
}
