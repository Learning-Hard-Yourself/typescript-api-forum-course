/**
 * Feature configuration with const type parameters (TS 5.0+).
 * Preserves literal types without requiring `as const` at call site.
 */
export function defineFeatureFlags<const T extends Record<string, boolean>>(flags: T): Readonly<T> {
    return Object.freeze(flags)
}

/**
 * Thread configuration with preserved literal types.
 * The `const` modifier ensures values are narrowed to their literal types.
 */
export function defineThreadConfig<
    const T extends {
        maxTitleLength: number
        maxContentLength: number
        allowedTags: readonly string[]
        pinnedLimit: number
    },
>(config: T): Readonly<T> {
    return Object.freeze(config)
}

/**
 * Post configuration with preserved literal types.
 */
export function definePostConfig<
    const T extends {
        maxContentLength: number
        maxAttachments: number
        allowedMimeTypes: readonly string[]
        editWindowMinutes: number
    },
>(config: T): Readonly<T> {
    return Object.freeze(config)
}

/**
 * User role permissions with const type parameter.
 * Ensures permission arrays are tuple types, not string[].
 */
export function defineRolePermissions<
    const T extends Record<string, readonly string[]>,
>(permissions: T): Readonly<T> {
    return Object.freeze(permissions)
}

/**
 * Rate limit configuration with const type parameter.
 */
export function defineRateLimits<
    const T extends Record<
        string,
        { windowMs: number; maxRequests: number; message?: string }
    >,
>(limits: T): Readonly<T> {
    return Object.freeze(limits)
}

/**
 * Notification settings with const type parameter.
 */
export function defineNotificationSettings<
    const T extends {
        channels: readonly ('email' | 'push' | 'inApp')[]
        events: readonly string[]
        batchIntervalMs: number
    },
>(settings: T): Readonly<T> {
    return Object.freeze(settings)
}

// ============================================
// Production Configurations
// ============================================

export const FORUM_FEATURES = defineFeatureFlags({
    darkMode: true,
    notifications: true,
    attachments: true,
    reactions: false,
    privateMessages: false,
    userBadges: true,
    threadPolls: false,
    codeHighlighting: true,
})

// Type is preserved as literal: { darkMode: true; notifications: true; ... }
// Not widened to { darkMode: boolean; notifications: boolean; ... }
export type ForumFeatures = typeof FORUM_FEATURES

export const THREAD_CONFIG = defineThreadConfig({
    maxTitleLength: 200,
    maxContentLength: 50000,
    allowedTags: ['discussion', 'question', 'announcement', 'tutorial', 'showcase'] as const,
    pinnedLimit: 5,
})

// Type preserves exact tuple: readonly ['discussion', 'question', ...]
export type ThreadTag = (typeof THREAD_CONFIG)['allowedTags'][number]

export const POST_CONFIG = definePostConfig({
    maxContentLength: 30000,
    maxAttachments: 10,
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
    ] as const,
    editWindowMinutes: 30,
})

export type AllowedMimeType = (typeof POST_CONFIG)['allowedMimeTypes'][number]

export const ROLE_PERMISSIONS = defineRolePermissions({
    user: ['read', 'create_thread', 'create_post', 'vote', 'report'] as const,
    moderator: [
        'read',
        'create_thread',
        'create_post',
        'vote',
        'report',
        'edit_any_post',
        'delete_any_post',
        'lock_thread',
        'pin_thread',
        'resolve_report',
    ] as const,
    admin: [
        'read',
        'create_thread',
        'create_post',
        'vote',
        'report',
        'edit_any_post',
        'delete_any_post',
        'lock_thread',
        'pin_thread',
        'resolve_report',
        'manage_users',
        'manage_categories',
        'manage_settings',
        'view_analytics',
    ] as const,
})

// Type preserves exact permissions per role
export type UserPermission = (typeof ROLE_PERMISSIONS)['user'][number]
export type ModeratorPermission = (typeof ROLE_PERMISSIONS)['moderator'][number]
export type AdminPermission = (typeof ROLE_PERMISSIONS)['admin'][number]

export const RATE_LIMITS = defineRateLimits({
    createThread: {
        windowMs: 60_000,
        maxRequests: 5,
        message: 'Too many threads created. Please wait a minute.',
    },
    createPost: {
        windowMs: 60_000,
        maxRequests: 20,
        message: 'Too many posts. Please slow down.',
    },
    vote: {
        windowMs: 60_000,
        maxRequests: 60,
    },
    report: {
        windowMs: 3600_000,
        maxRequests: 10,
        message: 'Report limit reached. Try again later.',
    },
    uploadAttachment: {
        windowMs: 60_000,
        maxRequests: 5,
        message: 'Upload limit reached.',
    },
})

export type RateLimitEndpoint = keyof typeof RATE_LIMITS

export const NOTIFICATION_SETTINGS = defineNotificationSettings({
    channels: ['email', 'push', 'inApp'] as const,
    events: [
        'reply_to_thread',
        'reply_to_post',
        'mention',
        'vote_received',
        'thread_pinned',
        'report_resolved',
    ] as const,
    batchIntervalMs: 300_000, // 5 minutes
})

export type NotificationChannel = (typeof NOTIFICATION_SETTINGS)['channels'][number]
export type NotificationEvent = (typeof NOTIFICATION_SETTINGS)['events'][number]

// ============================================
// Type-safe configuration access
// ============================================

/**
 * Checks if a feature is enabled.
 * Type parameter ensures only valid feature names are accepted.
 */
export function isFeatureEnabled<K extends keyof typeof FORUM_FEATURES>(
    feature: K,
): (typeof FORUM_FEATURES)[K] {
    return FORUM_FEATURES[feature]
}

/**
 * Gets the rate limit config for an endpoint.
 * Returns the exact config type, not a generic object.
 */
export function getRateLimit<K extends RateLimitEndpoint>(
    endpoint: K,
): (typeof RATE_LIMITS)[K] {
    return RATE_LIMITS[endpoint]
}

/**
 * Checks if a user role has a specific permission.
 */
export function hasPermission(
    role: keyof typeof ROLE_PERMISSIONS,
    permission: string,
): boolean {
    return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)
}
