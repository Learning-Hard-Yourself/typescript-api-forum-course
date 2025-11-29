import type { Disposable } from './Disposable'

/**
 * A request context that tracks timing and cleans up resources.
 * Used for request-scoped data and metrics collection.
 */
export class RequestContext implements Disposable {
    private readonly data = new Map<string, unknown>()
    private readonly startTime = performance.now()
    private completed = false

    private constructor(
        public readonly requestId: string,
        private readonly onComplete?: (metrics: RequestMetrics) => void,
    ) {}

    static create(
        requestId: string,
        onComplete?: (metrics: RequestMetrics) => void,
    ): RequestContext {
        return new RequestContext(requestId, onComplete)
    }

    set<T>(key: string, value: T): void {
        this.data.set(key, value)
    }

    get<T>(key: string): T | undefined {
        return this.data.get(key) as T | undefined
    }

    get elapsedMs(): number {
        return performance.now() - this.startTime
    }

    [Symbol.dispose](): void {
        if (this.completed) return
        this.completed = true
        const metrics: RequestMetrics = {
            requestId: this.requestId,
            durationMs: this.elapsedMs,
            timestamp: new Date().toISOString(),
        }
        this.onComplete?.(metrics)
        this.data.clear()
    }
}

export interface RequestMetrics {
    requestId: string
    durationMs: number
    timestamp: string
}
