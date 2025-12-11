import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { CategoryRepository } from '../repositories/CategoryRepository'

export class CategoryDeleter {
    public constructor(private readonly categoryRepository: CategoryRepository) { }

    public async execute(id: string): Promise<void> {
        const category = await this.categoryRepository.findById(id)

        if (!category) {
            throw new NotFoundError(`Category with id ${id} not found`)
        }

        // Optional: Check if category has children or threads before deleting
        // For now, we assume simple delete

        await this.categoryRepository.delete(id)
    }
}
