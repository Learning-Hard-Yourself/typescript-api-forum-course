import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { users } from '@/database/schema'
import type { ForumDatabase } from '@/database/types'
import { createTestApplication } from '@tests/support/createTestApplication'

const createExistingUser = async (database: ForumDatabase) => {
  const userId = uuidv7()
  await database.insert(users).values({
    id: userId,
    username: 'existing_user',
    email: 'existing@example.com',
    name: 'Existing User',
    displayName: 'Existing User',
    emailVerified: false,
    passwordHash: 'hashed:Existing123!Password',
    image: null,
    avatarUrl: null,
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  })
  return userId
}

describe('Authentication routes', () => {
  it('registers a new user and returns a session cookie', async () => {
    const { app, database } = await createTestApplication()

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sarah_dev',
        email: 'sarah@example.com',
        password: 'SecurePass123!',
        displayName: 'Sarah Johnson',
      })

    expect(response.statusCode).toBe(201)
    expect(response.body.data.user).toMatchObject({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      displayName: 'Sarah Johnson',
      avatarUrl: null,
      role: 'user',
    })
    expect(typeof response.body.data.user.id).toBe('string')
    expect(Array.isArray(response.get('set-cookie'))).toBe(true)

    const [record] = await database.select().from(users).where(eq(users.email, 'sarah@example.com')).limit(1)
    expect(record).toBeTruthy()
    expect(record?.passwordHash).not.toBe('SecurePass123!')
  })

  it('rejects registration when username or email already exist', async () => {
    const { app, database } = await createTestApplication()
    await createExistingUser(database)

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'existing_user',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        displayName: 'Another User',
      })

    expect(response.statusCode).toBe(409)
    expect(response.body.message).toBe('User with provided email or username already exists')
  })

  it('allows a registered user to sign in and issues session cookie', async () => {
    const { app } = await createTestApplication()

    await request(app).post('/api/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'sarah@example.com',
      password: 'SecurePass123!',
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.get('set-cookie'))).toBe(true)
    expect(response.body.data.user.email).toBe('sarah@example.com')
  })

  it('rejects sign in with invalid credentials', async () => {
    const { app } = await createTestApplication()

    await request(app).post('/api/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'sarah@example.com',
      password: 'WrongPassword!',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toBe('Invalid credentials')
  })

  it('returns the authenticated user when session cookie is present', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie')

    const sessionResponse = await request(app).get('/api/auth/me').set('Cookie', cookies)

    expect(sessionResponse.statusCode).toBe(200)
    expect(sessionResponse.body.data.user.email).toBe('sarah@example.com')
  })

  // Note: better-auth handles session refresh automatically when sessions are accessed
  // There is no dedicated manual refresh endpoint
  it.skip('refreshes the session and returns a new cookie', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie')

    const refreshResponse = await request(app).post('/api/auth/refresh').set('Cookie', cookies)

    expect(refreshResponse.statusCode).toBe(200)
    expect(Array.isArray(refreshResponse.get('set-cookie'))).toBe(true)
  })

  it('revokes the session on logout', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie')

    const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', cookies)

    expect(logoutResponse.statusCode).toBe(204)
    expect(Array.isArray(logoutResponse.get('set-cookie'))).toBe(true)

    const sessionResponse = await request(app).get('/api/auth/me').set('Cookie', logoutResponse.get('set-cookie'))
    expect(sessionResponse.statusCode).toBe(401)
  })
})
