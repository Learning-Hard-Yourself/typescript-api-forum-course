/**
 * Thread Update Model
 *
 * Demonstrates advanced TypeScript concepts:
 * - Utility Types (Partial, Pick, Omit, Required)
 * - Conditional Types (role-based permissions)
 * - Index Signatures (flexible metadata)
 * - Type Assertions (runtime validation)
 *
 * Educational Focus:
 * This file showcases how TypeScript's type system can enforce
 * business rules at compile-time AND runtime, creating a type-safe
 * permission system that prevents bugs before they happen.
 */

import type { Thread } from '@/types'

// ================================
// USER ROLES
// ================================

/**
 * User role types that match database schema
 * Used for permission checking throughout the application
 */
export type UserRole = 'user' | 'moderator' | 'admin'

// Const assertion for role values
export const USER_ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
} as const

// ================================
// UTILITY TYPES
// ================================

/**
 * Basic thread update payload
 * Uses Partial<T> to make all fields optional
 *
 * Learning: Partial is a mapped type that transforms all properties
 * of T to be optional. It's equivalent to:
 * type Partial<T> = { [P in keyof T]?: T[P] }
 */
export type ThreadUpdatePayload = Partial<{
    title: string
    isPinned: boolean
    isLocked: boolean
}>

/**
 * Only title can be updated by regular users
 * Uses Pick<T, K> to select specific properties from a type
 *
 * Learning: Pick selects a subset of properties from T.
 * It's defined as: type Pick<T, K extends keyof T> = { [P in K]: T[P] }
 */
export type UserEditableFields = Pick<ThreadUpdatePayload, 'title'>

/**
 * Admin-only fields (pinning and locking)
 * Uses Omit<T, K> to exclude specific properties
 *
 * Learning: Omit is the opposite of Pick. It excludes properties.
 * It's defined as: type Omit<T, K> = Pick<T, Exclude<keyof T, K>>
 */
export type AdminOnlyFields = Omit<ThreadUpdatePayload, keyof UserEditableFields>

/**
 * Required fields for thread creation
 * Uses Required<T> to make all properties required
 *
 * Learning: Required is the opposite of Partial.
 * It's defined as: type Required<T> = { [P in keyof T]-?: T[P] }
 * The -? removes the optional modifier
 */
export type ThreadCreationPayload = Required<Pick<Thread, 'title' | 'categoryId' | 'authorId'>>

// ================================
// CONDITIONAL TYPES
// ================================

/**
 * Conditional type that determines allowed updates based on user role
 *
 * Learning: Conditional types use the extends keyword to create
 * type-level if-then logic:
 * type MyType<T> = T extends Condition ? TrueType : FalseType
 *
 * This example shows how different roles get different permissions:
 * - Admins & Moderators can update ALL fields (ThreadUpdatePayload)
 * - Regular users can ONLY update title (UserEditableFields)
 */
export type AllowedUpdate<TRole extends UserRole> = TRole extends 'admin' | 'moderator'
    ? ThreadUpdatePayload // Admins can update everything
    : UserEditableFields // Users can only update title

// Type-level tests (compile-time validation)
// These types are computed at compile time and help document the behavior
type AdminCanUpdate = AllowedUpdate<'admin'> // Result: ThreadUpdatePayload
type ModeratorCanUpdate = AllowedUpdate<'moderator'> // Result: ThreadUpdatePayload
type UserCanUpdate = AllowedUpdate<'user'> // Result: UserEditableFields

/**
 * Conditional type to check if a role can modify admin fields
 *
 * Learning: Conditional types can return boolean-like types
 * This is useful for compile-time checks
 */
export type CanModifyAdminFields<TRole extends UserRole> = TRole extends 'admin' | 'moderator'
    ? true
    : false

// ================================
// INDEX SIGNATURES
// ================================

/**
 * Flexible metadata with index signature
 *
 * Learning: Index signatures allow objects to have dynamic keys
 * while still maintaining type safety for the values.
 *
 * Syntax: [key: KeyType]: ValueType
 *
 * This allows any string key, but the values must match the union type.
 * Named properties (viewCount, lastActivity, tags) provide autocomplete
 * while still allowing arbitrary keys.
 */
export interface ThreadMetadata {
    [key: string]: string | number | boolean | string[] | undefined
    viewCount?: number
    lastActivity?: string
    tags?: string[]
    customField?: string
}

/**
 * Thread with additional metadata
 * Demonstrates type intersection
 */
export interface ThreadWithMetadata extends Thread {
    metadata: ThreadMetadata
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard to check if user is admin or moderator
 *
 * Learning: Type guards use the `is` keyword to narrow types.
 * After this function returns true, TypeScript knows the role
 * is specifically 'admin' | 'moderator', not just UserRole.
 *
 * @param role - User role to check
 * @returns true if role is admin or moderator
 */
export function isAdminOrModerator(role: UserRole): role is 'admin' | 'moderator' {
    return role === 'admin' || role === 'moderator'
}

/**
 * Type guard to check if user is admin
 */
export function isAdmin(role: UserRole): role is 'admin' {
    return role === 'admin'
}

/**
 * Type guard to validate UserRole from unknown value
 */
export function isValidUserRole(value: unknown): value is UserRole {
    return value === 'user' || value === 'moderator' || value === 'admin'
}

// ================================
// TYPE ASSERTIONS
// ================================

/**
 * Assertion function that validates update payload structure
 *
 * Learning: Assertion functions use `asserts` keyword.
 * If the function returns normally (doesn't throw), TypeScript
 * knows the assertion is true for the rest of the scope.
 *
 * Syntax: asserts paramName is Type
 *
 * @param update - Value to validate
 * @throws Error if update is invalid
 */
export function assertValidUpdate(update: unknown): asserts update is ThreadUpdatePayload {
    if (typeof update !== 'object' || update === null) {
        throw new Error('Invalid update: must be an object')
    }

    const payload = update as Record<string, unknown>

    if ('title' in payload && typeof payload.title !== 'string') {
        throw new Error('Invalid update: title must be a string')
    }

    if ('isPinned' in payload && typeof payload.isPinned !== 'boolean') {
        throw new Error('Invalid update: isPinned must be a boolean')
    }

    if ('isLocked' in payload && typeof payload.isLocked !== 'boolean') {
        throw new Error('Invalid update: isLocked must be a boolean')
    }
}

/**
 * Assertion function that validates permissions for update
 *
 * Learning: This combines type guards with assertion functions
 * to create runtime permission checks that TypeScript understands.
 *
 * @param role - User role attempting the update
 * @param update - Update payload
 * @param isAuthor - Whether user is the thread author
 * @throws Error if user lacks permissions
 */
export function assertCanUpdate(
    role: UserRole,
    update: ThreadUpdatePayload,
    isAuthor: boolean,
): void {
    // Check if update contains admin-only fields
    const hasAdminFields = 'isPinned' in update || 'isLocked' in update

    // Only admins and moderators can modify admin fields
    if (hasAdminFields && !isAdminOrModerator(role)) {
        throw new Error('Only admins and moderators can pin or lock threads')
    }

    // For non-admin fields, user must be author OR admin/moderator
    if (!hasAdminFields && !isAuthor && !isAdminOrModerator(role)) {
        throw new Error('Only thread authors can update their threads')
    }
}

/**
 * Assertion that user is admin or moderator
 *
 * @param role - User role to check
 * @throws Error if user is not admin/moderator
 */
export function assertIsAdminOrModerator(role: UserRole): asserts role is 'admin' | 'moderator' {
    if (!isAdminOrModerator(role)) {
        throw new Error('This action requires admin or moderator permissions')
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Filters update payload based on user role
 *
 * Learning: This demonstrates runtime filtering based on
 * compile-time types. The return type changes based on TRole!
 *
 * @param role - User role
 * @param update - Update payload to filter
 * @returns Filtered update based on permissions
 */
export function filterUpdateByRole<TRole extends UserRole>(
    role: TRole,
    update: ThreadUpdatePayload,
): AllowedUpdate<TRole> {
    if (isAdminOrModerator(role)) {
        // Admins and moderators can update everything
        return update as AllowedUpdate<TRole>
    }

    // Regular users can only update title
    const { title } = update
    return { title } as AllowedUpdate<TRole>
}

/**
 * Checks if update contains only user-editable fields
 *
 * @param update - Update payload
 * @returns true if update only contains user-editable fields
 */
export function hasOnlyUserEditableFields(update: ThreadUpdatePayload): boolean {
    const userEditableKeys: Array<keyof UserEditableFields> = ['title']
    const updateKeys = Object.keys(update) as Array<keyof ThreadUpdatePayload>

    return updateKeys.every((key) => userEditableKeys.includes(key as keyof UserEditableFields))
}

/**
 * Checks if update contains admin-only fields
 *
 * @param update - Update payload
 * @returns true if update contains admin fields
 */
export function hasAdminOnlyFields(update: ThreadUpdatePayload): boolean {
    return 'isPinned' in update || 'isLocked' in update
}

// ================================
// TYPE DEMONSTRATIONS
// ================================

/**
 * Examples of TypeScript concepts in action
 * These are compile-time only and get removed in JavaScript
 */

// Example 1: Utility Types in action
type ExampleThread = Thread
type ExamplePartialThread = Partial<Thread> // All properties optional
type ExampleThreadWithTitle = Pick<Thread, 'id' | 'title'> // Only id and title
type ExampleThreadWithoutId = Omit<Thread, 'id'> // Everything except id
type ExampleRequiredThread = Required<Partial<Thread>> // Make optional required again

// Example 2: Conditional Types in action
type AdminUpdate = AllowedUpdate<'admin'> // ThreadUpdatePayload
type UserUpdate = AllowedUpdate<'user'> // UserEditableFields

// Example 3: Index Signatures in action
const metadata: ThreadMetadata = {
    viewCount: 100,
    lastActivity: '2024-03-20',
    customField: 'custom value',
    anotherField: true,
}

// Example 4: Type Guards in action
function exampleTypeGuard(role: UserRole) {
    if (isAdminOrModerator(role)) {
        // TypeScript knows role is 'admin' | 'moderator' here
        console.log('User has elevated permissions')
    } else {
        // TypeScript knows role is 'user' here
        console.log('User has standard permissions')
    }
}
