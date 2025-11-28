import { JsonResource } from '@/app/shared/resources/JsonResource'
import type { Category } from '@/types'

export interface CategoryOutput {
    id: string
    parentId: string | null
    name: string
    slug: string
    description: string | null
    order: number
    createdAt: string
    updatedAt: string
    children?: CategoryOutput[]
}

export class CategoryResource extends JsonResource<Category, CategoryOutput> {
    toArray(): CategoryOutput {
        const output: CategoryOutput = {
            id: this.resource.id,
            parentId: this.resource.parentId,
            name: this.resource.name,
            slug: this.resource.slug,
            description: this.resource.description,
            order: this.resource.order,
            createdAt: this.resource.createdAt,
            updatedAt: this.resource.updatedAt,
        }

        if (this.resource.children && this.resource.children.length > 0) {
            output.children = this.resource.children.map((child) => new CategoryResource(child).toArray())
        }

        return output
    }
}
