/**
 * Exhaustive checking utilities for discriminated unions.
 * Ensures all cases are handled at compile time.
 */

export function assertNever(value: never, message?: string): never {
    throw new Error(message ?? `Unexpected value: ${JSON.stringify(value)}`)
}

/**
 * Type-safe exhaustive match function for discriminated unions.
 * Forces handling of all union members at compile time.
 */
export function exhaustiveMatch<T extends string | number, R>(
    value: T,
    handlers: { [K in T]: () => R },
): R {
    const handler = handlers[value]
    if (!handler) {
        throw new Error(`No handler for value: ${value}`)
    }
    return handler()
}

/**
 * Type-safe exhaustive match for discriminated unions with a `type` property.
 */
export function matchDiscriminated<
    T extends { [K in D]: string },
    D extends keyof T,
    R,
>(
    value: T,
    discriminant: D,
    handlers: { [K in T[D] & string]: (v: Extract<T, { [P in D]: K }>) => R },
): R {
    const key = value[discriminant] as T[D] & string
    const handler = handlers[key]
    if (!handler) {
        throw new Error(`No handler for discriminant: ${String(key)}`)
    }
    return handler(value as Extract<T, { [P in D]: typeof key }>)
}

/**
 * Creates a type guard that narrows a discriminated union to a specific variant.
 */
export function createDiscriminantGuard<
    T extends { [K in D]: string },
    D extends keyof T,
    V extends T[D],
>(discriminant: D, value: V): (obj: T) => obj is Extract<T, { [K in D]: V }> {
    return (obj: T): obj is Extract<T, { [K in D]: V }> => obj[discriminant] === value
}
