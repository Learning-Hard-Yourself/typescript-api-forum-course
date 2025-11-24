import type { Thread } from '@/types'

export class ThreadResource {
    public toResponse(thread: Thread): Thread {
        return thread
    }
}
