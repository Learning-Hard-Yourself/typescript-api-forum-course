import type { Category } from '@/types'


export interface CategoryRepository {
    findById(id: string): Promise<Category | null>
    findBySlug(slug: string): Promise<Category | null>
    findAll(): Promise<Category[]>
    findByParentId(parentId: string | null): Promise<Category[]>
    save(category: Omit<Category, 'id'>): Promise<Category>
    update(id: string, category: Partial<Category>): Promise<Category>
    delete(id: string): Promise<void>
}
