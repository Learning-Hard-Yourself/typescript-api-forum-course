import type { UserRepository, UserStats } from '../repositories/UserRepository'

export interface UserStatsRetrieverInput {
    userId: string
}

export class UserStatsRetriever {
    public constructor(private readonly userRepository: UserRepository) {}

    public async execute(input: UserStatsRetrieverInput): Promise<UserStats> {
        return this.userRepository.getStats(input.userId)
    }
}
