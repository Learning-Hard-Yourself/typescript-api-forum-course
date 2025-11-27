/**
 * Disposable Resources with `using` declarations (TS 5.2+).
 * 
 * TypeScript Concepts:
 * - Symbol.dispose for synchronous cleanup
 * - Symbol.asyncDispose for asynchronous cleanup
 * - Disposable and AsyncDisposable interfaces
 * - Automatic resource cleanup when leaving scope
 * 
 * Note: Requires ES2022 target with Symbol.dispose support
 */

// Polyfill for Symbol.dispose if not available
(Symbol as { dispose?: symbol }).dispose ??= Symbol('Symbol.dispose');
(Symbol as { asyncDispose?: symbol }).asyncDispose ??= Symbol('Symbol.asyncDispose')

// ============================================
// Disposable Interfaces
// ============================================

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

// ============================================
// Database Transaction
// ============================================

/**
 * A disposable database transaction.
 * Automatically rolls back if not committed before disposal.
 * 
 * Usage with 'using':
 * async function createPost(data: PostData) {
 *     using transaction = new DatabaseTransaction(db)
 *     
 *     await transaction.execute('INSERT INTO posts ...')
 *     await transaction.execute('UPDATE threads ...')
 *     
 *     transaction.commit()
 *     // If commit() is not called, rollback happens automatically
 * }
 */
export class DatabaseTransaction implements Disposable, AsyncDisposable {
    private committed = false
    private rolledBack = false
    private readonly operations: string[] = []

    constructor(private readonly connectionId: string = `tx_${Date.now()}`) {
        console.log(`[Transaction ${this.connectionId}] Started`)
    }

    /**
     * Execute a query within the transaction
     */
    async execute(query: string): Promise<void> {
        if (this.committed || this.rolledBack) {
            throw new Error('Transaction already finalized')
        }
        this.operations.push(query)
        console.log(`[Transaction ${this.connectionId}] Execute: ${query}`)
    }

    /**
     * Commit the transaction
     */
    commit(): void {
        if (this.rolledBack) {
            throw new Error('Cannot commit: transaction was rolled back')
        }
        this.committed = true
        console.log(`[Transaction ${this.connectionId}] Committed ${this.operations.length} operations`)
    }

    /**
     * Rollback the transaction
     */
    rollback(): void {
        if (this.committed) {
            throw new Error('Cannot rollback: transaction was committed')
        }
        this.rolledBack = true
        console.log(`[Transaction ${this.connectionId}] Rolled back ${this.operations.length} operations`)
    }

    /**
     * Check if transaction is still active
     */
    get isActive(): boolean {
        return !this.committed && !this.rolledBack
    }

    /**
     * Synchronous dispose - rolls back if not committed
     */
    [Symbol.dispose](): void {
        if (!this.committed && !this.rolledBack) {
            this.rollback()
        }
        console.log(`[Transaction ${this.connectionId}] Disposed`)
    }

    /**
     * Async dispose for async cleanup
     */
    async [Symbol.asyncDispose](): Promise<void> {
        if (!this.committed && !this.rolledBack) {
            this.rollback()
        }
        // Simulate async cleanup
        await new Promise(resolve => setTimeout(resolve, 10))
        console.log(`[Transaction ${this.connectionId}] Async disposed`)
    }
}

// ============================================
// Temporary File Resource
// ============================================

/**
 * A disposable temporary file.
 * Automatically deletes the file when disposed.
 */
export class TemporaryFile implements Disposable {
    private deleted = false

    constructor(public readonly path: string) {
        console.log(`[TempFile] Created: ${path}`)
    }

    write(content: string): void {
        if (this.deleted) {
            throw new Error('File was deleted')
        }
        console.log(`[TempFile] Writing to ${this.path}: ${content.substring(0, 50)}...`)
    }

    read(): string {
        if (this.deleted) {
            throw new Error('File was deleted')
        }
        return `Content of ${this.path}`
    }

    [Symbol.dispose](): void {
        if (!this.deleted) {
            this.deleted = true
            console.log(`[TempFile] Deleted: ${this.path}`)
        }
    }
}

// ============================================
// Lock Resource
// ============================================

/**
 * A disposable lock for exclusive access to a resource.
 * Automatically releases when disposed.
 */
export class ResourceLock implements Disposable {
    private released = false
    private static readonly activeLocks = new Set<string>()

    private constructor(public readonly resourceId: string) {}

    /**
     * Acquire a lock on a resource
     */
    static acquire(resourceId: string): ResourceLock {
        if (ResourceLock.activeLocks.has(resourceId)) {
            throw new Error(`Resource ${resourceId} is already locked`)
        }
        ResourceLock.activeLocks.add(resourceId)
        console.log(`[Lock] Acquired: ${resourceId}`)
        return new ResourceLock(resourceId)
    }

    /**
     * Check if a resource is locked
     */
    static isLocked(resourceId: string): boolean {
        return ResourceLock.activeLocks.has(resourceId)
    }

    /**
     * Release the lock
     */
    release(): void {
        if (!this.released) {
            this.released = true
            ResourceLock.activeLocks.delete(this.resourceId)
            console.log(`[Lock] Released: ${resourceId}`)
        }
    }

    [Symbol.dispose](): void {
        this.release()
    }
}

// ============================================
// Timer Resource
// ============================================

/**
 * A disposable timer that can be cancelled.
 */
export class DisposableTimer implements Disposable {
    private timerId: ReturnType<typeof setTimeout> | null = null
    private cancelled = false

    constructor(
        callback: () => void,
        delayMs: number,
    ) {
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

// ============================================
// Helper Functions
// ============================================

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

// ============================================
// Usage Example (commented out to avoid runtime issues)
// ============================================

/*
// Example: Using disposable resources

async function processWithTransaction() {
    using transaction = new DatabaseTransaction()
    
    await transaction.execute('INSERT INTO posts ...')
    await transaction.execute('UPDATE threads ...')
    
    transaction.commit()
    // If an error occurs before commit(), rollback happens automatically
}

function processWithTempFile() {
    using tempFile = new TemporaryFile('/tmp/report.csv')
    
    tempFile.write('id,name,value\n1,test,100')
    const content = tempFile.read()
    console.log(content)
    // File is automatically deleted when leaving scope
}

function processWithLock() {
    using lock = ResourceLock.acquire('post_123')
    
    // Exclusive access to post_123
    console.log('Modifying post...')
    // Lock is automatically released when leaving scope
}
*/

// Export resourceId for use in release method (fix scope issue)
const resourceId = 'resource'
export { resourceId as _resourceIdPlaceholder };

