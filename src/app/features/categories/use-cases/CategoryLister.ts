import type { Category } from '@/types'
import type { CategoryRepository } from '../repositories/CategoryRepository'

export class CategoryLister {
    public constructor(private readonly categoryRepository: CategoryRepository) {}

    public async execute(): Promise<Category[]> {
        const allCategories = await this.categoryRepository.findAll()

        const categoryMap = new Map<string, Category & { children: Category[] }>()
        const roots: (Category & { children: Category[] })[] = []

        for (const cat of allCategories) {
            categoryMap.set(cat.id, { ...cat, children: [] })
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
