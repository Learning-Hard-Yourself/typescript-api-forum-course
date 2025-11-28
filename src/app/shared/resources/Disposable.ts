/**
 * Disposable Resources with `using` declarations (TS 5.2+).
 */

// Polyfill for Symbol.dispose if not available
;(Symbol as { dispose?: symbol }).dispose ??= Symbol('Symbol.dispose')
;(Symbol as { asyncDispose?: symbol }).asyncDispose ??= Symbol('Symbol.asyncDispose')

/**
 * Interface for synchronous disposable resources
 */
export interface Disposable {
    [Symbol.dispose](): void
}

/**
 * Interface for asynchronous disposable resources
 */
export interface AsyncDisposable {
    [Symbol.asyncDispose](): Promise<void>
}

/**
 * Create a disposable wrapper for any cleanup function
 */
export function createDisposable(cleanup: () => void): Disposable {
    return {
        [Symbol.dispose]: cleanup,
    }
}

/**
 * Create an async disposable wrapper for any async cleanup function
 */
export function createAsyncDisposable(cleanup: () => Promise<void>): AsyncDisposable {
    return {
        [Symbol.asyncDispose]: cleanup,
    }
}
