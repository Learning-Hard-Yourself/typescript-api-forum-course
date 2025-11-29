import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Category } from '@/types'
import type { CategoryRepository } from '../repositories/CategoryRepository'

export interface CategoryFinderInput {
    id: string
}

export class CategoryFinder {
    public constructor(private readonly categoryRepository: CategoryRepository) {}

    public async execute(input: CategoryFinderInput): Promise<Category> {
        const category = await this.categoryRepository.findById(input.id)

        if (!category) {
            throw new NotFoundError(`Category with ID ${input.id} not found`)
        }

        return category
    }
}
