

// Polyfill for Symbol.dispose if not available
;(Symbol as { dispose?: symbol }).dispose ??= Symbol('Symbol.dispose')
;(Symbol as { asyncDispose?: symbol }).asyncDispose ??= Symbol('Symbol.asyncDispose')


export interface Disposable {
    [Symbol.dispose](): void
}


export interface AsyncDisposable {
    [Symbol.asyncDispose](): Promise<void>
}


export function createDisposable(cleanup: () => void): Disposable {
    return {
        [Symbol.dispose]: cleanup,
    }
}


export function createAsyncDisposable(cleanup: () => Promise<void>): AsyncDisposable {
    return {
        [Symbol.asyncDispose]: cleanup,
    }
}
