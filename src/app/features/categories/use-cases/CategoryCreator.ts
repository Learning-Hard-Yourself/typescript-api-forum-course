import type { CategoryCreationAttributes } from '@/app/features/categories/requests/CategoryCreationRequest'
import { ConflictError } from '@/app/shared/errors/ConflictError'
import type { Category } from '@/types'
import type { CategoryRepository } from '../repositories/CategoryRepository'

export interface CategoryCreatorInput {
    attributes: CategoryCreationAttributes
}

export class CategoryCreator {
    public constructor(private readonly categoryRepository: CategoryRepository) {}

    public async execute(input: CategoryCreatorInput): Promise<Category> {
        const { attributes } = input

        const existing = await this.categoryRepository.findBySlug(attributes.slug)

        if (existing) {
            throw new ConflictError('Category with this slug already exists', { slug: attributes.slug })
        }

        return this.categoryRepository.save({
            name: attributes.name,
            slug: attributes.slug,
            description: attributes.description ?? null,
            parentId: attributes.parentId ?? null,
            order: attributes.order ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
    }
}
