import type { AsyncDisposable } from './Disposable'

export class RateLimitToken implements AsyncDisposable {
    private released = false
    private static readonly tokens = new Map<string, number>()

    private constructor(
        private readonly key: string,
        private readonly limit: number,
    ) {}

    static async acquire(key: string, limit: number): Promise<RateLimitToken> {
        const current = this.tokens.get(key) ?? 0
        if (current >= limit) {
            throw new Error(`Rate limit exceeded for ${key}`)
        }
        this.tokens.set(key, current + 1)
        return new RateLimitToken(key, limit)
    }

    static getCurrentCount(key: string): number {
        return this.tokens.get(key) ?? 0
    }

    async [Symbol.asyncDispose](): Promise<void> {
        if (this.released) return
        this.released = true
        const current = RateLimitToken.tokens.get(this.key) ?? 1
        if (current <= 1) {
            RateLimitToken.tokens.delete(this.key)
        } else {
            RateLimitToken.tokens.set(this.key, current - 1)
        }
    }
}
