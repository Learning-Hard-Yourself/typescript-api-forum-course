import type { Express } from 'express'
import request from 'supertest'

/**
 * Helper to create an authenticated session for testing
 * Returns the session cookie that can be used in subsequent requests
 */
export async function authenticateUser(app: Express, userData: {
    username: string
    email: string
    displayName: string
    password: string
}): Promise<string> {
    const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

    // Extract session cookie from response
    const cookies = response.headers['set-cookie']
    if (!cookies || cookies.length === 0) {
        throw new Error('No session cookie returned from registration')
    }

    // Return the cookie string
    return Array.isArray(cookies) ? cookies[0] : cookies
}

/**
 * Helper to make authenticated requests
 */
export function authenticatedRequest(app: Express, cookie: string) {
    return {
        get: (url: string) => request(app).get(url).set('Cookie', cookie),
        post: (url: string) => request(app).post(url).set('Cookie', cookie),
        patch: (url: string) => request(app).patch(url).set('Cookie', cookie),
        delete: (url: string) => request(app).delete(url).set('Cookie', cookie),
    }
}
