

// Define the shape of our configuration
interface AppConfig {
    readonly port: number
    readonly host: string
    readonly apiVersion: string
    readonly environment: 'development' | 'production' | 'test'
}

interface AuthConfig {
    readonly sessionExpiresIn: number
    readonly accessTokenExpiresIn: number
    readonly refreshTokenExpiresIn: number
    readonly minPasswordLength: number
    readonly maxPasswordLength: number
}

interface PaginationConfig {
    readonly defaultLimit: number
    readonly maxLimit: number
}

interface RateLimitConfig {
    readonly windowMs: number
    readonly maxRequests: number
}

// Using satisfies - the value is validated against the type,
// but TypeScript preserves the literal types
export const APP_CONFIG = {
    port: 3000,
    host: 'localhost',
    apiVersion: 'v1',
    environment: (process.env.NODE_ENV ?? 'development') as AppConfig['environment'],
} satisfies AppConfig

// The type of APP_CONFIG.port is `number` (from interface)
// but we could also access it knowing it's specifically 3000

export const AUTH_CONFIG = {
    sessionExpiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    accessTokenExpiresIn: 60 * 15, // 15 minutes in seconds
    refreshTokenExpiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    minPasswordLength: 8,
    maxPasswordLength: 128,
} satisfies AuthConfig

export const PAGINATION_CONFIG = {
    defaultLimit: 20,
    maxLimit: 100,
} satisfies PaginationConfig

export const RATE_LIMIT_CONFIG = {
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
    },
    api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
    },
    upload: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
    },
} satisfies Record<string, RateLimitConfig>

// Example of satisfies preserving literal types
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://forum.example.com',
] as const satisfies readonly string[]

// Type is preserved as the tuple of specific strings
export type AllowedOrigin = (typeof ALLOWED_ORIGINS)[number]

export { ALLOWED_ORIGINS }

// Export config types for use elsewhere
export type { AppConfig, AuthConfig, PaginationConfig, RateLimitConfig }
