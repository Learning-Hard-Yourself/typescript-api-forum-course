import { asc } from 'drizzle-orm'

import type { ForumDatabase } from '@/config/database-types'
import { categories } from '@/config/schema'
import type { Category } from '@/types'

/**
 * Use case for listing all categories in a tree structure.
 */
export class CategoryLister {
    public constructor(private readonly database: ForumDatabase) {}

    public async execute(): Promise<Category[]> {
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
