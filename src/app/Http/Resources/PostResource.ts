import type { Post } from '@/types'

export class PostResource {
    public toResponse(post: Post): Post {
        return post
    }
}
