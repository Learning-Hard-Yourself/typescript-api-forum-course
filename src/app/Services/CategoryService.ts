import { asc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'

import { ConflictError } from '@/app/Errors/ConflictError'
import type { CategoryCreationAttributes } from '@/app/Http/Requests/CategoryCreationRequest'
import { UserService } from '@/app/Services/UserService'
import { categories } from '@/database/schema'
import type { Category } from '@/types'

export class CategoryService extends UserService {
    public constructor(database: UserService['database']) {
        super(database)
    }

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

        // Build tree structure
        const categoryMap = new Map<string, Category & { children: Category[] }>()
        const roots: (Category & { children: Category[] })[] = []

        // First pass: create map entries
        for (const cat of allCategories) {
            categoryMap.set(cat.id, { ...(cat as Category), children: [] })
        }

        // Second pass: link children to parents
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
