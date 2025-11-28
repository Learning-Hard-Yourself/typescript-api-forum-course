/**
 * Reusable Utility Types for the Forum API.
 */

import type { UserRole } from '@/app/features/users/models/User'

/**
 * Makes specific properties required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Makes specific properties optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Makes all properties mutable (removes readonly)
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
}

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Deep readonly - makes all nested properties readonly
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Extract keys of a specific value type
 */
export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Pick only string keys
 */
export type StringKeys<T> = KeysOfType<T, string>

/**
 * Pick only number keys
 */
export type NumberKeys<T> = KeysOfType<T, number>

/**
 * Pick only boolean keys
 */
export type BooleanKeys<T> = KeysOfType<T, boolean>

/**
 * Make properties nullable
 */
export type Nullable<T> = {
    [P in keyof T]: T[P] | null
}

/**
 * Function type with any arguments and return type
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * Async version of a function
 */
export type Async<T extends AnyFunction> = (
    ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>

/**
 * Extract the element type from an array
 */
export type ElementType<T> = T extends (infer E)[] ? E : never

/**
 * Union to Intersection converter
 */
export type UnionToIntersection<U> = 
    (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void 
        ? I 
        : never

/**
 * Get the last element type of a union
 */
export type LastOfUnion<T> = UnionToIntersection<
    T extends unknown ? () => T : never
> extends () => infer R
    ? R
    : never

/**
 * Strict omit - only allows omitting existing keys
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Strict pick - ensures all keys exist
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>

// Forum API specific utility types

/** Role that is not admin */
export type NonAdminRole = Exclude<UserRole, 'admin'>

/** Role with elevated permissions (moderator or admin) */
export type ElevatedRole = Exclude<UserRole, 'user'>
