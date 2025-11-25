import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { eq } from 'drizzle-orm'

import { createTestApplication } from '@tests/support/createTestApplication'
import { users } from '@/config/schema'

const seedUser = async (context: Awaited<ReturnType<typeof createTestApplication>>) => {
  const userId = 'usr_1'
  await context.database
    .insert(users)
    .values({
      id: userId,
      username: 'sarah_dev',
      email: 'sarah@example.com',
      displayName: 'Sarah Johnson',
      passwordHash: 'hashed:initial',
      avatarUrl: null,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    })

  return userId
}

describe('PATCH /api/users/:id', () => {
  it('updates a user when the payload is valid', async () => {
    const context = await createTestApplication()
    const userId = await seedUser(context)

    const response = await request(context.app)
      .patch(`/api/users/${userId}`)
      .send({
        displayName: 'Sarah J.',
        avatarUrl: 'https://cdn.example.com/avatar.png',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.data).toMatchObject({
      id: userId,
      username: 'sarah_dev',
      email: 'sarah@example.com',
      displayName: 'Sarah J.',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    })
    expect(response.body.data.password).toBeUndefined()

    const [record] = await context.database.select().from(users).where(eq(users.id, userId)).limit(1)
    expect(record?.displayName).toBe('Sarah J.')
    expect(record?.avatarUrl).toBe('https://cdn.example.com/avatar.png')
  })

  it('returns validation errors when payload is invalid', async () => {
    const context = await createTestApplication()
    const userId = await seedUser(context)

    const response = await request(context.app)
      .patch(`/api/users/${userId}`)
      .send({ displayName: 'S' })

    expect(response.statusCode).toBe(422)
    expect(Array.isArray(response.body.errors)).toBe(true)
    expect(response.body.errors.length).toBeGreaterThan(0)
  })

  it('returns 404 when the user does not exist', async () => {
    const context = await createTestApplication()

    const response = await request(context.app)
      .patch('/api/users/unknown-user')
      .send({
        displayName: 'Nobody',
      })

    expect(response.statusCode).toBe(404)
    expect(response.body.message).toBe('User not found')
  })

  it('returns 409 when trying to update to an existing username or email', async () => {
    const context = await createTestApplication()
    const userId = await seedUser(context)

    await context.database.insert(users).values({
      id: 'usr_2',
      username: 'existing_user',
      email: 'existing@example.com',
      displayName: 'Existing User',
      passwordHash: 'hashed:existing',
      avatarUrl: null,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    })

    const response = await request(context.app)
      .patch(`/api/users/${userId}`)
      .send({
        username: 'existing_user',
        email: 'existing@example.com',
      })

    expect(response.statusCode).toBe(409)
    expect(response.body.message).toBe('User with provided email or username already exists')
  })
})
