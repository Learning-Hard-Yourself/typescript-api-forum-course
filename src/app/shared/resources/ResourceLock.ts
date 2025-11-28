import type { Disposable } from './Disposable'

/**
 * A disposable lock for exclusive access to a resource.
 * Automatically releases when disposed.
 */
export class ResourceLock implements Disposable {
    private released = false
    private static readonly activeLocks = new Set<string>()

    private constructor(public readonly resourceId: string) {}

    static acquire(resourceId: string): ResourceLock {
        if (ResourceLock.activeLocks.has(resourceId)) {
            throw new Error(`Resource ${resourceId} is already locked`)
        }
        ResourceLock.activeLocks.add(resourceId)
        console.log(`[Lock] Acquired: ${resourceId}`)
        return new ResourceLock(resourceId)
    }

    static isLocked(resourceId: string): boolean {
        return ResourceLock.activeLocks.has(resourceId)
    }

    release(): void {
        if (!this.released) {
            this.released = true
            ResourceLock.activeLocks.delete(this.resourceId)
            console.log(`[Lock] Released: ${this.resourceId}`)
        }
    }

    [Symbol.dispose](): void {
        this.release()
    }
}
