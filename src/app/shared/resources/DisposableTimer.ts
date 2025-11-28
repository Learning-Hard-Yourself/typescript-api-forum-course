import type { Disposable } from './Disposable'

/**
 * A disposable timer that can be cancelled.
 */
export class DisposableTimer implements Disposable {
    private timerId: ReturnType<typeof setTimeout> | null = null
    private cancelled = false

    constructor(callback: () => void, delayMs: number) {
        this.timerId = setTimeout(() => {
            if (!this.cancelled) {
                callback()
            }
            this.timerId = null
        }, delayMs)
        console.log(`[Timer] Started: ${delayMs}ms`)
    }

    cancel(): void {
        if (this.timerId && !this.cancelled) {
            clearTimeout(this.timerId)
            this.cancelled = true
            console.log('[Timer] Cancelled')
        }
    }

    [Symbol.dispose](): void {
        this.cancel()
    }
}
