import type { Vote, VoteType } from '@/app/features/votes/models/Vote'


export interface VoteRepository {
    findById(id: string): Promise<Vote | null>
    findByPostId(postId: string): Promise<Vote[]>
    findByUserId(userId: string): Promise<Vote[]>
    findByPostAndUser(postId: string, userId: string): Promise<Vote | null>
    save(vote: Omit<Vote, 'id'>): Promise<Vote>
    update(id: string, voteType: VoteType): Promise<Vote>
    delete(id: string): Promise<void>
    deleteByPostAndUser(postId: string, userId: string): Promise<void>
}
