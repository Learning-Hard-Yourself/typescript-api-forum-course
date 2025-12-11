import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { Category } from '@/types'
import type { CategoryRepository } from '../repositories/CategoryRepository'
import type { CategoryUpdateAttributes } from '../requests/CategoryUpdateRequest'

export class CategoryUpdater {
    public constructor(private readonly categoryRepository: CategoryRepository) { }

    public async execute(id: string, data: CategoryUpdateAttributes): Promise<Category> {
        const category = await this.categoryRepository.findById(id)

        if (!category) {
            throw new NotFoundError(`Category with id ${id} not found`)
        }

        return this.categoryRepository.update(id, data)
    }
}
