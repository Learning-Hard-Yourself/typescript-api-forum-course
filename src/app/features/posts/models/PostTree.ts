/**
 * Post Tree Model - Demonstrates Advanced TypeScript Concepts
 *
 * This file showcases:
 * 1. Recursive Types for nested structures
 * 2. Generic Constraints for type-safe operations
 * 3. Template Literal Types for depth tracking
 * 4. Mapped Types for transformations
 */

// ==================================================
// 1. TEMPLATE LITERAL TYPES - Depth Tracking
// ==================================================
// Template literal types allow creating string literal types programmatically
export type DepthLevel = 0 | 1 | 2 | 3 | 4 | 5
export type Depth = `level-${DepthLevel}`

// Type-safe depth constants
export const MAX_DEPTH: DepthLevel = 5

/**
 * Convert number to Depth type (with validation)
 */
export function toDepth(level: number): Depth {
    if (level < 0 || level > MAX_DEPTH) {
        throw new Error(`Invalid depth: ${level}. Must be between 0 and ${MAX_DEPTH}`)
    }
    return `level-${level as DepthLevel}`
}

// ==================================================
// 2. BASE POST INTERFACE
// ==================================================
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

// ==================================================
// 3. RECURSIVE TYPE - Post with Replies
// ==================================================
/**
 * Post with nested replies
 * This is a RECURSIVE type - it references itself!
 */
export interface PostWithReplies extends Post {
    replies?: PostWithReplies[] // Recursion here!
    depth?: Depth
}

// ==================================================
// 4. GENERIC TREE NODE
// ==================================================
/**
 * Generic tree node that can work with any type
 * Demonstrates: Generic type constraints
 */
export type TreeNode<T> = T & {
    children?: TreeNode<T>[]
}

/**
 * Type helper to extract the base type from TreeNode
 */
export type ExtractNodeType<T> = T extends TreeNode<infer U> ? U : never

// ==================================================
// 5. MAPPED TYPES - Transform Properties
// ==================================================
/**
 * Make all properties of a post tree readonly
 * Demonstrates: Mapped types with recursion
 */
export type ReadonlyPostTree<T extends PostWithReplies> = {
    readonly [K in keyof T]: T[K] extends PostWithReplies[]
    ? ReadonlyArray<ReadonlyPostTree<T[K][number]>>
    : T[K]
}

/**
 * Extract only specific fields from a post tree
 * Demonstrates: Mapped types + Utility types
 */
export type PostTreeSummary = {
    [K in keyof PostWithReplies as K extends 'id' | 'content' | 'authorId' | 'replies' ? K : never]: PostWithReplies[K]
}

// ==================================================
// 6. TYPE GUARDS FOR POST TREES
// ==================================================
/**
 * Check if a post has replies
 * Type guard with generic constraint
 */
export function hasReplies<T extends PostWithReplies>(post: T): post is T & { replies: PostWithReplies[] } {
    return Array.isArray(post.replies) && post.replies.length > 0
}

/**
 * Check if post is at max depth
 */
export function isAtMaxDepth(post: PostWithReplies): boolean {
    if (!post.depth) return false
    const level = parseInt(post.depth.split('-')[1] ?? '0')
    return level >= MAX_DEPTH
}

// ==================================================
// 7. TREE BUILDING FUNCTIONS
// ==================================================
/**
 * Build a tree structure from flat list of posts
 * Demonstrates: Generic functions with constraints
 */
export function buildPostTree(posts: Post[]): PostWithReplies[] {
    // Create a map for O(1) lookups
    const postMap = new Map<string, PostWithReplies>()

    // Initialize all posts with empty replies array
    posts.forEach((post) => {
        postMap.set(post.id, { ...post, replies: [], depth: toDepth(0) })
    })

    // Build the tree structure
    const rootPosts: PostWithReplies[] = []

    posts.forEach((post) => {
        const currentPost = postMap.get(post.id)!

        if (post.parentPostId === null) {
            // This is a root post
            rootPosts.push(currentPost)
        } else {
            // This is a reply
            const parentPost = postMap.get(post.parentPostId)

            if (parentPost) {
                // Calculate depth
                const parentDepth = parentPost.depth ? parseInt(parentPost.depth.split('-')[1] ?? '0') : 0
                const newDepth = Math.min(parentDepth + 1, MAX_DEPTH)
                currentPost.depth = toDepth(newDepth)

                // Add to parent's replies
                if (!parentPost.replies) {
                    parentPost.replies = []
                }
                parentPost.replies.push(currentPost)
            }
        }
    })

    return rootPosts
}

/**
 * Flatten a post tree back to a list
 * Demonstrates: Recursion with generic constraints
 */
export function flattenPostTree<T extends PostWithReplies>(posts: T[]): T[] {
    const result: T[] = []

    function traverse(post: T) {
        // Add current post (without replies for flat structure)
        const { replies, ...postWithoutReplies } = post
        result.push(postWithoutReplies as T)

        // Recursively traverse replies
        if (replies && replies.length > 0) {
            replies.forEach((reply) => traverse(reply as T))
        }
    }

    posts.forEach(traverse)
    return result
}

/**
 * Count total posts in a tree (including nested)
 */
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

/**
 * Get maximum depth in a post tree
 */
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

// ==================================================
// 8. CONDITIONAL TYPES - Advanced Features
// ==================================================
/**
 * Extract reply type from a post
 * Demonstrates: Conditional types with inference
 */
export type ExtractReplies<T> = T extends { replies: infer R } ? R : never

/**
 * Check if type has replies property
 */
export type HasReplies<T> = T extends { replies: unknown[] } ? true : false

// Example usage of conditional types
type PostHasReplies = HasReplies<PostWithReplies> // true
type BasePostHasReplies = HasReplies<Post> // false
