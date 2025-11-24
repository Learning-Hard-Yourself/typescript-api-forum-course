import type { User } from '@/app/Models/User'

export type UserResponse = Omit<User, 'passwordHash'>

export class UserResource {
  public toResponse(user: User): UserResponse {
    const { passwordHash: _passwordHash, ...rest } = user
    void _passwordHash
    return rest
  }
}
