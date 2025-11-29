import type { Disposable } from './Disposable'

/**
 * A temporary cache entry that expires and cleans up automatically.
 * Used for short-lived cached data like session validation results.
 */
export class CacheEntry<T> implements Disposable {
    private invalidated = false
    private readonly timer: ReturnType<typeof setTimeout>
    private static readonly cache = new Map<string, unknown>()

    private constructor(
        private readonly key: string,
        public readonly value: T,
        ttlMs: number,
    ) {
        CacheEntry.cache.set(key, value)
        this.timer = setTimeout(() => this.invalidate(), ttlMs)
    }

    static create<T>(key: string, value: T, ttlMs: number): CacheEntry<T> {
        return new CacheEntry(key, value, ttlMs)
    }

    static get<T>(key: string): T | undefined {
        return CacheEntry.cache.get(key) as T | undefined
    }

    private invalidate(): void {
        if (this.invalidated) return
        this.invalidated = true
        CacheEntry.cache.delete(this.key)
    }

    [Symbol.dispose](): void {
        clearTimeout(this.timer)
        this.invalidate()
    }
}
