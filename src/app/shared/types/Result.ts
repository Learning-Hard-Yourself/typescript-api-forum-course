export type Result<T, E = Error> = Success<T> | Failure<E>

export interface Success<T> {
    readonly ok: true
    readonly value: T
}

export interface Failure<E> {
    readonly ok: false
    readonly error: E
}

export function ok<T>(value: T): Success<T> {
    return { ok: true, value }
}

export function err<E>(error: E): Failure<E> {
    return { ok: false, error }
}

export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
    return result.ok === true
}

export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
    return result.ok === false
}

export function unwrap<T, E>(result: Result<T, E>): T {
    if (isOk(result)) return result.value
    throw result.error
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (isOk(result)) return result.value
    return defaultValue
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (isOk(result)) return ok(fn(result.value))
    return result
}

export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (isErr(result)) return err(fn(result.error))
    return result
}

export function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (isOk(result)) return fn(result.value)
    return result
}

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
        const value = await fn()
        return ok(value)
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)))
    }
}

export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
    try {
        const value = fn()
        return ok(value)
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)))
    }
}
