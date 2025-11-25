

export type DepthLevel = 0 | 1 | 2 | 3 | 4 | 5
export type Depth = `level-${DepthLevel}`

export const MAX_DEPTH: DepthLevel = 5

export function toDepth(level: number): Depth {
    if (level < 0 || level > MAX_DEPTH) {
        throw new Error(`Invalid depth: ${level}. Must be between 0 and ${MAX_DEPTH}`)
    }
    return `level-${level as DepthLevel}`
}

export interface Post {
    id: string
    threadId: string
    parentPostId: string | null
    authorId: string
    content: string
    voteScore: number
    isEdited: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
}

export interface PostWithReplies extends Post {
    replies?: PostWithReplies[]
    depth?: Depth
}

export type TreeNode<T> = T & {
    children?: TreeNode<T>[]
}

export type ExtractNodeType<T> = T extends TreeNode<infer U> ? U : never

export type ReadonlyPostTree<T extends PostWithReplies> = {
    readonly [K in keyof T]: T[K] extends PostWithReplies[]
    ? ReadonlyArray<ReadonlyPostTree<T[K][number]>>
    : T[K]
}

export type PostTreeSummary = {
    [K in keyof PostWithReplies as K extends 'id' | 'content' | 'authorId' | 'replies' ? K : never]: PostWithReplies[K]
}

export function hasReplies<T extends PostWithReplies>(post: T): post is T & { replies: PostWithReplies[] } {
    return Array.isArray(post.replies) && post.replies.length > 0
}

export function isAtMaxDepth(post: PostWithReplies): boolean {
    if (!post.depth) return false
    const level = parseInt(post.depth.split('-')[1] ?? '0')
    return level >= MAX_DEPTH
}

export function buildPostTree(posts: Post[]): PostWithReplies[] {

    const postMap = new Map<string, PostWithReplies>()

    posts.forEach((post) => {
        postMap.set(post.id, { ...post, replies: [], depth: toDepth(0) })
    })

    const rootPosts: PostWithReplies[] = []

    posts.forEach((post) => {
        const currentPost = postMap.get(post.id)!

        if (post.parentPostId === null) {

            rootPosts.push(currentPost)
        } else {

            const parentPost = postMap.get(post.parentPostId)

            if (parentPost) {

                const parentDepth = parentPost.depth ? parseInt(parentPost.depth.split('-')[1] ?? '0') : 0
                const newDepth = Math.min(parentDepth + 1, MAX_DEPTH)
                currentPost.depth = toDepth(newDepth)

                if (!parentPost.replies) {
                    parentPost.replies = []
                }
                parentPost.replies.push(currentPost)
            }
        }
    })

    return rootPosts
}

export function flattenPostTree<T extends PostWithReplies>(posts: T[]): T[] {
    const result: T[] = []

    function traverse(post: T) {

        const { replies, ...postWithoutReplies } = post
        result.push(postWithoutReplies as T)

        if (replies && replies.length > 0) {
            replies.forEach((reply) => traverse(reply as T))
        }
    }

    posts.forEach(traverse)
    return result
}

export function countPostsInTree(posts: PostWithReplies[]): number {
    let count = 0

    function traverse(post: PostWithReplies) {
        count++
        if (hasReplies(post)) {
            post.replies.forEach(traverse)
        }
    }

    posts.forEach(traverse)
    return count
}

export function getMaxDepthInTree(posts: PostWithReplies[]): number {
    let maxDepth = 0

    function traverse(post: PostWithReplies) {
        if (post.depth) {
            const depth = parseInt(post.depth.split('-')[1] ?? '0')
            maxDepth = Math.max(maxDepth, depth)
        }

        if (hasReplies(post)) {
            post.replies.forEach(traverse)
        }
    }

    posts.forEach(traverse)
    return maxDepth
}

export type ExtractReplies<T> = T extends { replies: infer R } ? R : never

export type HasReplies<T> = T extends { replies: unknown[] } ? true : false

type PostHasReplies = HasReplies<PostWithReplies>
type BasePostHasReplies = HasReplies<Post>
