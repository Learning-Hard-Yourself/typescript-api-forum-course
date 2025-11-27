/**
 * Branded Types (Nominal Typing) for type-safe IDs.
 * 
 * TypeScript Concept: Branded/Nominal Types
 * - TypeScript uses structural typing by default
 * - Branded types add a phantom property to create nominal types
 * - Prevents accidentally mixing up different ID types
 * - The brand property never exists at runtime
 */

// The Brand utility type adds a phantom type property
declare const __brand: unique symbol
type Brand<K, T> = K & { readonly [__brand]: T }

// ============================================
// Entity ID Types
// ============================================

export type UserId = Brand<string, 'UserId'>
export type PostId = Brand<string, 'PostId'>
export type ThreadId = Brand<string, 'ThreadId'>
export type CategoryId = Brand<string, 'CategoryId'>
export type SessionId = Brand<string, 'SessionId'>
export type AttachmentId = Brand<string, 'AttachmentId'>
export type NotificationId = Brand<string, 'NotificationId'>
export type VoteId = Brand<string, 'VoteId'>
export type ReportId = Brand<string, 'ReportId'>

// ============================================
// Value Object Types (for other validated values)
// ============================================

export type Email = Brand<string, 'Email'>
export type Username = Brand<string, 'Username'>
export type Slug = Brand<string, 'Slug'>
export type IpAddress = Brand<string, 'IpAddress'>

// ============================================
// Factory Functions
// ============================================

/**
 * Creates a branded UserId from a string.
 * In a real app, you might add validation here.
 */
export function createUserId(id: string): UserId {
    return id as UserId
}

export function createPostId(id: string): PostId {
    return id as PostId
}

export function createThreadId(id: string): ThreadId {
    return id as ThreadId
}

export function createCategoryId(id: string): CategoryId {
    return id as CategoryId
}

export function createSessionId(id: string): SessionId {
    return id as SessionId
}

export function createAttachmentId(id: string): AttachmentId {
    return id as AttachmentId
}

export function createNotificationId(id: string): NotificationId {
    return id as NotificationId
}

export function createVoteId(id: string): VoteId {
    return id as VoteId
}

export function createReportId(id: string): ReportId {
    return id as ReportId
}

// ============================================
// Value Object Factories with Validation
// ============================================

export function createEmail(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`)
    }
    return email.toLowerCase() as Email
}

export function createUsername(username: string): Username {
    if (username.length < 3 || username.length > 30) {
        throw new Error('Username must be between 3 and 30 characters')
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores')
    }
    return username as Username
}

export function createSlug(text: string): Slug {
    const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    return slug as Slug
}

export function createIpAddress(ip: string): IpAddress {
    // Simple validation - in production use a proper IP validation library
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip) && ip !== '::1') {
        throw new Error(`Invalid IP address: ${ip}`)
    }
    return ip as IpAddress
}

// ============================================
// Type Guards
// ============================================

export function isUserId(value: unknown): value is UserId {
    return typeof value === 'string' && value.length > 0
}

export function isPostId(value: unknown): value is PostId {
    return typeof value === 'string' && value.length > 0
}

export function isThreadId(value: unknown): value is ThreadId {
    return typeof value === 'string' && value.length > 0
}

// ============================================
// Utility Types for Branded Types
// ============================================

/**
 * Extracts the base type from a branded type
 */
export type UnwrapBrand<T> = T extends Brand<infer U, unknown> ? U : T

/**
 * Converts all branded ID fields in an object to their base types
 */
export type UnbrandedIds<T> = {
    [K in keyof T]: T[K] extends Brand<infer U, unknown> ? U : T[K]
}

/**
 * Example usage showing type safety:
 * 
 * const userId: UserId = createUserId('user_123')
 * const postId: PostId = createPostId('post_456')
 * 
 * function getPost(id: PostId) { ... }
 * 
 * getPost(userId) // ❌ Type error! Can't pass UserId where PostId expected
 * getPost(postId) // ✅ Works correctly
 */
