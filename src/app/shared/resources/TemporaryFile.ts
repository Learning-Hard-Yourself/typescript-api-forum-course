import type { Disposable } from './Disposable'


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
