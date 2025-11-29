import type { Express } from 'express'
import request from 'supertest'

export interface AuthCredentials {
    accessToken: string
    cookies: string[]
}


export async function authenticateUser(app: Express, userData: {
    username: string
    email: string
    displayName: string
    password: string
}): Promise<AuthCredentials> {
    const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

    
    const cookies = response.headers['set-cookie']
    if (!cookies || cookies.length === 0) {
        throw new Error('No session cookie returned from registration')
    }

    
    const accessToken = response.body.data?.accessToken
    if (!accessToken) {
        throw new Error('No access token returned from registration')
    }

    return {
        accessToken,
        cookies: Array.isArray(cookies) ? cookies : [cookies],
    }
}


export function authenticatedRequest(app: Express, auth: AuthCredentials | string) {
    
    const authHeader = typeof auth === 'string'
        ? undefined
        : `Bearer ${auth.accessToken}`
    const cookie = typeof auth === 'string'
        ? auth
        : auth.cookies.join('; ')

    const addAuth = (req: request.Test) => {
        if (authHeader) {
            req.set('Authorization', authHeader)
        }
        return req.set('Cookie', cookie)
    }

    return {
        get: (url: string) => addAuth(request(app).get(url)),
        post: (url: string) => addAuth(request(app).post(url)),
        patch: (url: string) => addAuth(request(app).patch(url)),
        delete: (url: string) => addAuth(request(app).delete(url)),
    }
}


export function cookieAuthenticatedRequest(app: Express, cookies: string | string[]) {
    const cookie = Array.isArray(cookies) ? cookies.join('; ') : cookies
    return {
        get: (url: string) => request(app).get(url).set('Cookie', cookie),
        post: (url: string) => request(app).post(url).set('Cookie', cookie),
        patch: (url: string) => request(app).patch(url).set('Cookie', cookie),
        delete: (url: string) => request(app).delete(url).set('Cookie', cookie),
    }
}
