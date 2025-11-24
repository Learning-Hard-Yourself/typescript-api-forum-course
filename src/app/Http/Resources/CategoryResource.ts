import type { Category } from '@/types'

export class CategoryResource {
    public toResponse(category: Category): Category {
        return category
    }
}
