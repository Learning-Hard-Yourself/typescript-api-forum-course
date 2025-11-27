/**
 * Advanced Utility Types.
 * 
 * TypeScript Concepts:
 * - ReturnType<T> - extracts return type of a function
 * - Parameters<T> - extracts parameter types as a tuple
 * - Awaited<T> - unwraps Promise types
 * - NonNullable<T> - removes null and undefined
 * - Exclude<T, U> - removes types from a union
 * - ConstructorParameters<T> - extracts constructor parameter types
 * - InstanceType<T> - extracts instance type from a class
 */

// ============================================
// Re-export built-in utility types with examples
// ============================================

/**
 * Example function for demonstrating ReturnType and Parameters
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleAsyncFunction(
    userId: string,
    _options: { includeDeleted: boolean },
): Promise<{ id: string; name: string } | null> {
    return { id: userId, name: 'Example' }
}

// ReturnType extracts the return type of a function
export type ExampleReturnType = ReturnType<typeof exampleAsyncFunction>
// Result: Promise<{ id: string; name: string } | null>

// Awaited unwraps Promise types
export type ExampleAwaitedReturn = Awaited<ReturnType<typeof exampleAsyncFunction>>
// Result: { id: string; name: string } | null

// Parameters extracts parameter types as a tuple
export type ExampleParams = Parameters<typeof exampleAsyncFunction>
// Result: [userId: string, options: { includeDeleted: boolean }]

// NonNullable removes null and undefined
export type ExampleNonNullable = NonNullable<ExampleAwaitedReturn>
// Result: { id: string; name: string }

// ============================================
// Custom Utility Types
// ============================================

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

// ============================================
// Practical Examples for the Forum API
// ============================================

import type { UserRole } from '@/app/features/users/models/User';

// Exclude 'admin' from UserRole
export type NonAdminRole = Exclude<UserRole, 'admin'>
// Result: 'user' | 'moderator'

// Exclude 'user' from UserRole  
export type ElevatedRole = Exclude<UserRole, 'user'>
// Result: 'moderator' | 'admin'

// Example class for ConstructorParameters and InstanceType
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ExampleService {
    constructor(
        private readonly _database: unknown,
        private readonly _logger: unknown,
    ) {}
}

// ConstructorParameters extracts constructor params
export type ExampleServiceParams = ConstructorParameters<typeof ExampleService>
// Result: [database: unknown, logger: unknown]

// InstanceType extracts the instance type
export type ExampleServiceInstance = InstanceType<typeof ExampleService>
// Result: ExampleService
