import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import type { Middleware } from 'better-call'
import { APIError } from 'better-call'
import { v7 as uuidv7 } from 'uuid'

import { schema } from '@/config/schema'
import type { ApplicationDependencies } from '@/routes/types'

const DEFAULT_MIN_PASSWORD_LENGTH = 12
const DEFAULT_MAX_PASSWORD_LENGTH = 128

// Token expiration settings
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60 // 15 minutes in seconds
const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 // 7 days in seconds

export type AuthInstance = ReturnType<typeof betterAuth>

const normaliseDate = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    return value
  }
  return new Date().toISOString()
}

const createAuth = ({ database }: ApplicationDependencies) =>
  betterAuth({
    basePath: '/api/auth',
    database: drizzleAdapter(database, {
      provider: 'sqlite',
      schema,
      usePlural: true,
    }),
    secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: DEFAULT_MIN_PASSWORD_LENGTH,
      maxPasswordLength: DEFAULT_MAX_PASSWORD_LENGTH,
    },
    user: {
      additionalFields: {
        username: {
          type: 'string',
          required: true,
          unique: true,
          returned: true,
        },
        displayName: {
          type: 'string',
          required: true,
          returned: true,
        },
        avatarUrl: {
          type: 'string',
          required: false,
          returned: true,
        },
        role: {
          type: 'string',
          required: true,
          defaultValue: 'user',
          returned: true,
        },
        lastActiveAt: {
          type: 'string',
          required: true,
          defaultValue: () => new Date().toISOString(),
          returned: false,
        },
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: ACCESS_TOKEN_EXPIRES_IN, // How often to refresh the session
      storeSessionInDatabase: true,
    },
    trustedOrigins: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    plugins: [
      bearer(),
    ],
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const identifiers: Array<string | undefined> = [user.username, user.email?.toLowerCase()]
            if (identifiers.some(Boolean)) {
              const { eq, or } = await import('drizzle-orm')

              const predicates = [] as Array<ReturnType<typeof eq>>
              if (user.username) {
                predicates.push(eq(schema.users.username, user.username))
              }
              if (user.email) {
                predicates.push(eq(schema.users.email, user.email.toLowerCase()))
              }

              const where = predicates.length === 1 ? predicates[0] : or(...predicates)
              const existingUser = await database.query.users.findFirst({ where })
              if (existingUser) {
                throw new APIError('UNPROCESSABLE_ENTITY', {
                  message: 'User with provided email or username already exists',
                })
              }
            }

            const data: any = {
              ...user,
              id: user.id ?? uuidv7(),
              email: user.email?.toLowerCase(),
              emailVerified: user.emailVerified ?? false,
              createdAt: normaliseDate(user.createdAt),
              updatedAt: normaliseDate(user.updatedAt),
            }

            if (user.displayName) {
              data.displayName = user.displayName
              data.name = user.displayName
            } else if (user.name) {
              data.displayName = user.name
              data.name = user.name
            } else {

              data.name = ''
              data.displayName = ''
            }

            if (user.avatarUrl !== undefined) {
              data.avatarUrl = user.avatarUrl
              data.image = user.avatarUrl
            } else if (user.image !== undefined) {
              data.avatarUrl = user.image
              data.image = user.image
            } else {
              data.avatarUrl = null
              data.image = null
            }

            data.username = user.username ?? ''
            data.role = user.role ?? 'user'
            data.lastActiveAt = user.lastActiveAt ? normaliseDate(user.lastActiveAt) : new Date().toISOString()

            return { data }
          },
          after: async (user) => {
            return user
          },
        },
        update: {
          before: async (user) => ({
            data: {
              ...user,
              updatedAt: normaliseDate(user.updatedAt),
              lastActiveAt: user.lastActiveAt ? normaliseDate(user.lastActiveAt) : undefined,
            },
          }),
        },
      },
      session: {
        create: {
          before: async (session) => ({
            data: {
              ...session,
              id: session.id ?? uuidv7(),
              expiresAt: normaliseDate(session.expiresAt),
              createdAt: normaliseDate(session.createdAt),
              updatedAt: normaliseDate(session.updatedAt),
            },
          }),
        },
        update: {
          before: async (session) => ({
            data: {
              ...session,
              updatedAt: normaliseDate(session.updatedAt),
            },
          }),
        },
      },
      account: {
        create: {
          before: async (account) => ({
            data: {
              ...account,
              id: account.id ?? uuidv7(),
              createdAt: normaliseDate(account.createdAt),
              updatedAt: normaliseDate(account.updatedAt),
            },
          }),
        },
        update: {
          before: async (account) => ({
            data: {
              ...account,
              updatedAt: normaliseDate(account.updatedAt),
            },
          }),
        },
      },
    },
  })

export type AuthContext = ReturnType<typeof createAuth>

let authInstance: AuthInstance | null = null

export const initAuth = (dependencies: ApplicationDependencies): AuthInstance => {
  if (authInstance) {
    return authInstance
  }

  authInstance = createAuth(dependencies)
  return authInstance
}

export const getAuth = (): AuthInstance => {
  if (!authInstance) {
    throw new Error('Auth instance has not been initialized')
  }

  return authInstance
}

export const resetAuth = (): void => {
  authInstance = null
}

export type AuthHandler = Middleware
