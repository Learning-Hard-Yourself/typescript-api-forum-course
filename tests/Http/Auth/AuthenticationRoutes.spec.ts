import { eq } from 'drizzle-orm'
import request from 'supertest'
import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import type { ForumDatabase } from '@/config/database-types'
import { users } from '@/config/schema'
import { cookieAuthenticatedRequest } from '@tests/support/authHelper'
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
  it('registers a new user and returns accessToken + session cookie', async () => {
    const { app, database } = await createTestApplication()

    const response = await request(app)
      .post('/api/v1/auth/register')
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
    // Verify accessToken is returned
    expect(typeof response.body.data.accessToken).toBe('string')
    expect(response.body.data.accessToken.length).toBeGreaterThan(0)
    // Verify session cookie is set
    expect(Array.isArray(response.get('set-cookie'))).toBe(true)

    const [record] = await database.select().from(users).where(eq(users.email, 'sarah@example.com')).limit(1)
    expect(record).toBeTruthy()
    expect(record?.passwordHash).not.toBe('SecurePass123!')
  })

  it('rejects registration when username or email already exist', async () => {
    const { app, database } = await createTestApplication()
    await createExistingUser(database)

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'existing_user',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        displayName: 'Another User',
      })

    expect(response.statusCode).toBe(409)
    expect(response.body.message).toBe('User with provided email or username already exists')
  })

  it('allows a registered user to sign in and returns accessToken + cookie', async () => {
    const { app } = await createTestApplication()

    await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'sarah@example.com',
      password: 'SecurePass123!',
    })

    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.get('set-cookie'))).toBe(true)
    expect(response.body.data.user.email).toBe('sarah@example.com')
    // Verify accessToken is returned on login
    expect(typeof response.body.data.accessToken).toBe('string')
    expect(response.body.data.accessToken.length).toBeGreaterThan(0)
  })

  it('rejects sign in with invalid credentials', async () => {
    const { app } = await createTestApplication()

    await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'sarah@example.com',
      password: 'WrongPassword!',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toBe('Invalid credentials')
  })

  it('returns the authenticated user when using Bearer token', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const accessToken = registerResponse.body.data.accessToken

    // Use Bearer token for authentication
    const sessionResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(sessionResponse.statusCode).toBe(200)
    expect(sessionResponse.body.data.user.email).toBe('sarah@example.com')
  })

  it('returns the authenticated user when using session cookie', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie') ?? []

    // Use cookies for authentication (refresh token pattern)
    const sessionResponse = await cookieAuthenticatedRequest(app, cookies).get('/api/v1/auth/me')

    expect(sessionResponse.statusCode).toBe(200)
    expect(sessionResponse.body.data.user.email).toBe('sarah@example.com')
  })

  it('refreshes the session and returns a new accessToken', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie') ?? []

    // Use cookies to refresh and get new accessToken
    const refreshResponse = await cookieAuthenticatedRequest(app, cookies).post('/api/v1/auth/refresh')

    expect(refreshResponse.statusCode).toBe(200)
    expect(typeof refreshResponse.body.data.accessToken).toBe('string')
    expect(refreshResponse.body.data.accessToken.length).toBeGreaterThan(0)
  })

  it('revokes the session on logout', async () => {
    const { app } = await createTestApplication()

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'sarah_dev',
      email: 'sarah@example.com',
      password: 'SecurePass123!',
      displayName: 'Sarah Johnson',
    })

    const cookies = registerResponse.get('set-cookie') ?? []

    const logoutResponse = await cookieAuthenticatedRequest(app, cookies).post('/api/v1/auth/logout')

    expect(logoutResponse.statusCode).toBe(204)
    expect(Array.isArray(logoutResponse.get('set-cookie'))).toBe(true)

    // After logout, session should be invalid
    const newCookies = logoutResponse.get('set-cookie') ?? []
    const sessionResponse = await cookieAuthenticatedRequest(app, newCookies).get('/api/v1/auth/me')
    expect(sessionResponse.statusCode).toBe(401)
  })
})
