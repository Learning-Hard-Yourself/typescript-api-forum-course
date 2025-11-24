import type { User } from '@/app/Models/User'
import type { users } from '@/database/schema'
import type { ForumDatabase } from '@/database/types'

type DatabaseUserRecord = typeof users.$inferSelect

export abstract class UserService {
  protected constructor(protected readonly database: ForumDatabase) {}

  protected hashPassword(password: string): string {
    return `hashed:${password}`
  }

  protected mapRecordToUser(record: DatabaseUserRecord): User {
    return {
      id: record.id,
      username: record.username,
      email: record.email,
      displayName: record.displayName,
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      role: record.role,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastActiveAt: record.lastActiveAt,
    }
  }
}
