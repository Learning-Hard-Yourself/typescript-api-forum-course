import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { users } from '@/config/schema'
import { authenticateUser, authenticatedRequest } from '@tests/support/authHelper'
import { createTestApplication } from '@tests/support/createTestApplication'

describe('PATCH /api/v1/users/:id', () => {
  it('updates a user when the payload is valid', async () => {
    const context = await createTestApplication()

    
    const cookie = await authenticateUser(context.app, {
      username: 'sarah_dev',
      email: 'sarah@example.com',
      displayName: 'Sarah Johnson',
      password: 'SecurePassword123!',
    })

    
    const [user] = await context.database.select().from(users).where(eq(users.email, 'sarah@example.com'))
    const userId = user.id

    const response = await authenticatedRequest(context.app, cookie)
      .patch(`/api/v1/users/${userId}`)
      .send({
        displayName: 'Sarah J.',
        avatarUrl: 'https://example.com/avatar.png',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.data).toMatchObject({
      id: userId,
      username: 'sarah_dev',
      email: 'sarah@example.com',
      displayName: 'Sarah J.',
      avatarUrl: 'https://example.com/avatar.png',
    })
    expect(response.body.data.password).toBeUndefined()

    const [record] = await context.database.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(record.displayName).toBe('Sarah J.')
    expect(record.avatarUrl).toBe('https://example.com/avatar.png')
  })

  it('returns validation errors when payload is invalid', async () => {
    const context = await createTestApplication()

    
    const cookie = await authenticateUser(context.app, {
      username: 'sarah_dev2',
      email: 'sarah2@example.com',
      displayName: 'Sarah Johnson',
      password: 'SecurePassword123!',
    })

    
    const [user] = await context.database.select().from(users).where(eq(users.email, 'sarah2@example.com'))
    const userId = user.id

    const response = await authenticatedRequest(context.app, cookie)
      .patch(`/api/v1/users/${userId}`)
      .send({
        displayName: 'AB', 
      })

    expect(response.statusCode).toBe(422)
    expect(response.body.message).toBe('Validation failed')
  })

  it('returns 404 when the user does not exist', async () => {
    const context = await createTestApplication()

    
    const cookie = await authenticateUser(context.app, {
      username: 'sarah_dev3',
      email: 'sarah3@example.com',
      displayName: 'Sarah Johnson',
      password: 'SecurePassword123!',
    })

    const response = await authenticatedRequest(context.app, cookie)
      .patch('/api/v1/users/nonexistent')
      .send({
        displayName: 'New Name',
      })

    expect(response.statusCode).toBe(403)
    expect(response.body.message).toContain('Forbidden')
  })

  it('returns 409 when trying to update to an existing username or email', async () => {
    const context = await createTestApplication()

    
    await authenticateUser(context.app, {
      username: 'existing_user',
      email: 'existing@example.com',
      displayName: 'Existing User',
      password: 'SecurePassword123!',
    })

    
    const cookie = await authenticateUser(context.app, {
      username: 'sarah_dev4',
      email: 'sarah4@example.com',
      displayName: 'Sarah Johnson',
      password: 'SecurePassword123!',
    })

    
    const [user] = await context.database.select().from(users).where(eq(users.email, 'sarah4@example.com'))
    const userId = user.id

    const response = await authenticatedRequest(context.app, cookie)
      .patch(`/api/v1/users/${userId}`)
      .send({
        email: 'existing@example.com', 
      })

    expect(response.statusCode).toBe(409)
    expect(response.body.message).toBe('User with provided email or username already exists')
  })
})
