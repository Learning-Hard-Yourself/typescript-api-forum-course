import type { AsyncDisposable, Disposable } from './Disposable'


export class DatabaseTransaction implements Disposable, AsyncDisposable {
    private committed = false
    private rolledBack = false
    private readonly operations: string[] = []

    constructor(private readonly connectionId: string = `tx_${Date.now()}`) {
        console.log(`[Transaction ${this.connectionId}] Started`)
    }

    async execute(query: string): Promise<void> {
        if (this.committed || this.rolledBack) {
            throw new Error('Transaction already finalized')
        }
        this.operations.push(query)
        console.log(`[Transaction ${this.connectionId}] Execute: ${query}`)
    }

    commit(): void {
        if (this.rolledBack) {
            throw new Error('Cannot commit: transaction was rolled back')
        }
        this.committed = true
        console.log(`[Transaction ${this.connectionId}] Committed ${this.operations.length} operations`)
    }

    rollback(): void {
        if (this.committed) {
            throw new Error('Cannot rollback: transaction was committed')
        }
        this.rolledBack = true
        console.log(`[Transaction ${this.connectionId}] Rolled back ${this.operations.length} operations`)
    }

    get isActive(): boolean {
        return !this.committed && !this.rolledBack
    }

    [Symbol.dispose](): void {
        if (!this.committed && !this.rolledBack) {
            this.rollback()
        }
        console.log(`[Transaction ${this.connectionId}] Disposed`)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        if (!this.committed && !this.rolledBack) {
            this.rollback()
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
        console.log(`[Transaction ${this.connectionId}] Async disposed`)
    }
}
