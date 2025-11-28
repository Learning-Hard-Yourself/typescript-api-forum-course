import { and, eq, ne, or } from 'drizzle-orm'

import { ConflictError } from '@/app/shared/errors/ConflictError'
import { NotFoundError } from '@/app/shared/errors/NotFoundError'
import type { UserUpdateAttributes } from '@/app/features/users/requests/UserUpdateRequest'
import type { User } from '@/app/features/users/models/User'
import { users } from '@/config/schema'
import type { ForumDatabase } from '@/config/database-types'

export interface UserUpdateInput {
  readonly id: string
  readonly attributes: UserUpdateAttributes
}

export class UserUpdater {
  public constructor(private readonly database: ForumDatabase) { }

  public async execute(input: UserUpdateInput): Promise<User> {
    const existing = await this.database
      .select()
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1)

    const [record] = existing

    if (!record) {
      throw new NotFoundError('User not found', { userId: input.id })
    }

    const updatePayload: Partial<typeof users.$inferInsert> = {}

    if (input.attributes.username !== undefined) {
      updatePayload.username = input.attributes.username
    }

    if (input.attributes.email !== undefined) {
      updatePayload.email = input.attributes.email
    }

    if (input.attributes.displayName !== undefined) {
      updatePayload.displayName = input.attributes.displayName
    }

    if (input.attributes.avatarUrl !== undefined) {
      updatePayload.avatarUrl = input.attributes.avatarUrl
    }

    if (input.attributes.role !== undefined) {
      updatePayload.role = input.attributes.role
    }

    const timestamp = new Date().toISOString()
    updatePayload.updatedAt = timestamp

    const uniquenessPredicates = []
    if (input.attributes.username !== undefined) {
      uniquenessPredicates.push(eq(users.username, input.attributes.username))
    }

    if (input.attributes.email !== undefined) {
      uniquenessPredicates.push(eq(users.email, input.attributes.email))
    }

    if (uniquenessPredicates.length > 0) {
      const predicate = uniquenessPredicates.length === 1 ? uniquenessPredicates[0] : or(...uniquenessPredicates)
      const [conflict] = await this.database
        .select({ id: users.id })
        .from(users)
        .where(and(predicate, ne(users.id, input.id)))
        .limit(1)

      if (conflict) {
        throw new ConflictError('User with provided email or username already exists', {
          userId: conflict.id,
          attemptedId: input.id,
          username: input.attributes.username,
          email: input.attributes.email,
        })
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.database.update(users).set(updatePayload).where(eq(users.id, input.id))
    }

    const [updatedRecord] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1)

    if (!updatedRecord) {
      throw new NotFoundError('User not found', { userId: input.id })
    }

    return this.mapRecordToUser(updatedRecord)
  }

  private mapRecordToUser(record: typeof users.$inferSelect): User {
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
