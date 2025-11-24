export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly displayName: string
  readonly passwordHash: string
  readonly avatarUrl: string | null
  readonly role: UserRole
  readonly createdAt: string
  readonly updatedAt: string
  readonly lastActiveAt: string
}
