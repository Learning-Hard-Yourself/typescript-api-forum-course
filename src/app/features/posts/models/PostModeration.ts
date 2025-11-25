/**
 * Post Moderation Types
 *
 * Demonstrates:
 * - Tuple Types for fixed-length arrays with specific types
 * - Advanced Union Types for complex state management
 * - Type Predicates for runtime type checking
 *
 * Educational Focus:
 * Shows how Tuple Types provide type safety for fixed-length arrays
 * where each position has a known, specific type.
 */

import type { Post } from '@/types'

// ================================
// TUPLE TYPES
// ================================

/**
 * Tuple for edit history entry
 *
 * Learning: Tuples are arrays with:
 * - Fixed length (TypeScript knows exactly how many elements)
 * - Fixed types (TypeScript knows the type at each position)
 * - Named elements (optional, for documentation)
 *
 * Syntax: [type1, type2, type3] or [name1: type1, name2: type2]
 *
 * Use when:
 * - Returning multiple related values from a function
 * -storing data in a specific order
 * - Need better type safety than regular arrays
 */
export type EditHistoryEntry = [
    timestamp: string,
    editorId: string,
    previousContent: string,
    newContent: string,
    reason: string | null,
]

/**
 * Example: Type-safe tuple access
 */
const exampleEdit: EditHistoryEntry = [
    '2024-03-20T12:00:00Z', // Position 0: timestamp
    'usr_123', // Position 1: editorId
    'Old content', // Position 2: previousContent
    'New content', // Position 3: newContent
    'Fixed typo', // Position 4: reason
]

// TypeScript knows the exact type at each position!
const timestamp: string = exampleEdit[0] // ✓ TypeScript knows it's string
const editorId: string = exampleEdit[1] // ✓ TypeScript knows it's string
// const invalid: number = exampleEdit[0]  // ✗ Error: Type 'string' is not assignable to type 'number'

/**
 * Tuple with optional elements
 * Optional elements MUST come at the end!
 */
export type ModerationEvent = [action: 'edit' | 'delete' | 'restore', targetId: string, moderatorId: string, reason?: string]

/**
 * Readonly tuple for immutability
 * Cannot modify elements after creation
 */
export type ReadonlyEditEntry = readonly [string, string, string, string, string | null]

/**
 * Tuple vs Array comparison
 */
// Regular array: unknown length, all same type
const regularArray: string[] = ['a', 'b', 'c']
regularArray.push('d') // ✓ Can add more

// Tuple: fixed length, specific types
const tuple: [string, number] = ['a', 1]
// tuple.push('c')  // ✗ Error: Tuple of length 2 has no element at index 2

// ================================
// TUPLE UTILITY TYPES
// ================================

/**
 * Extract specific position from tuple
 */
export type EditTimestamp = EditHistoryEntry[0] // string
export type EditorId = EditHistoryEntry[1] // string
export type PreviousContent = EditHistoryEntry[2] // string

/**
 * Get union of all tuple elements
 */
export type TupleElement<T extends readonly unknown[]> = T[number]

// Example: Get any element type from edit entry
type AnyEditField = TupleElement<EditHistoryEntry>
// Result: string | null

/**
 * Tuple length
 */
export type TupleLength<T extends readonly unknown[]> = T['length']
type EditEntryLength = TupleLength<EditHistoryEntry> // 5

// ================================
// ADVANCED UNION TYPES
// ================================

/**
 * Detailed post status
 *
 * Learning: Union types can have many alternatives for precise state modeling
 */
export type PostStatus =
    | 'active'
    | 'edited'
    | 'deleted'
    | 'deleted_by_author'
    | 'deleted_by_moderator'
    | 'restored'

/**
 * Discriminated union for post moderation state
 *
 * Learning: Each variant has different properties based on 'status'.
 * TypeScript narrows types based on checking the discriminant.
 */
export type PostModerationState =
    | { status: 'active'; post: Post }
    | { status: 'edited'; post: Post; editCount: number; lastEditedAt: string }
    | {
        status: 'deleted'
        postId: string
        deletedAt: string
        deletedBy: string
        reason?: string
    }
    | { status: 'restored'; post: Post; restoredAt: string; restoredBy: string }

/**
 * Interface for post with edit history
 */
export interface PostWithHistory extends Post {
    editHistory: EditHistoryEntry[]
    editCount: number
}

/**
 * Post edit data structure
 */
export interface PostEdit {
    id: string
    postId: string
    editorId: string
    previousContent: string
    newContent: string
    editReason: string | null
    createdAt: string
}

// ================================
// TYPE PREDICATES
// ================================

/**
 * Type predicate to check if post is deleted
 *
 * Learning: Type predicates use 'is' keyword to narrow types.
 * The return type 'post is Type' tells TypeScript that if this
 * function returns true, the parameter IS that specific type.
 */
export function isDeletedPost(
    post: Post,
): post is Post & { deletedAt: string; deletedBy: string } {
    return post.isDeleted === true && post.deletedAt != null && post.deletedBy != null
}

/**
 * Type predicate for edited posts
 */
export function isEditedPost(post: Post): post is Post & { isEdited: true } {
    return post.isEdited === true
}

/**
 * Narrow moderation state by discriminant
 */
export function isDeletedState(
    state: PostModerationState,
): state is Extract<PostModerationState, { status: 'deleted' }> {
    return state.status === 'deleted'
}

export function isEditedState(
    state: PostModerationState,
): state is Extract<PostModerationState, { status: 'edited' }> {
    return state.status === 'edited'
}

// ================================
// TUPLE HELPER FUNCTIONS
// ================================

/**
 * Create edit history entry from post edit
 */
export function createEditHistoryEntry(edit: PostEdit): EditHistoryEntry {
    return [edit.createdAt, edit.editorId, edit.previousContent, edit.newContent, edit.editReason]
}

/**
 * Destructure edit history entry
 */
export function destructureEditEntry(entry: EditHistoryEntry) {
    const [timestamp, editorId, previousContent, newContent, reason] = entry

    return {
        timestamp,
        editorId,
        previousContent,
        newContent,
        reason,
    }
}

/**
 * Compare two edit entries
 */
export function isSameEdit(a: EditHistoryEntry, b: EditHistoryEntry): boolean {
    return (
        a[0] === b[0] && // timestamp
        a[1] === b[1] && // editorId
        a[2] === b[2] && // previousContent
        a[3] === b[3] && // newContent
        a[4] === b[4] // reason
    )
}

// ================================
// USAGE EXAMPLES
// ================================

/**
 * Example: Using tuples for function returns
 */
function getEditInfo(edit: PostEdit): [string, number, number] {
    const contentLength = edit.newContent.length
    const diff = edit.newContent.length - edit.previousContent.length

    // Return tuple with specific types
    return [edit.createdAt, contentLength, diff]
}

/**
 * Example: Destructuring tuples
 */
const [editTime, length, difference] = getEditInfo({
    id: '1',
    postId: 'p1',
    editorId: 'u1',
    previousContent: 'old',
    newContent: 'new content',
    editReason: null,
    createdAt: '2024-03-20',
})

// TypeScript knows: editTime is string, length is number, difference is number

/**
 * Example: Type narrowing with discriminated unions
 */
function handleModerationState(state: PostModerationState) {
    switch (state.status) {
        case 'active':
            // TypeScript knows: state.post exists
            console.log('Post is active:', state.post.id)
            break

        case 'edited':
            // TypeScript knows: state.post AND state.editCount exist
            console.log(`Post edited ${state.editCount} times`)
            break

        case 'deleted':
            // TypeScript knows: state.deletedAt and state.deletedBy exist
            // But state.post does NOT exist!
            console.log(`Deleted at ${state.deletedAt} by ${state.deletedBy}`)
            break

        case 'restored':
            // TypeScript knows: state.post AND state.restoredAt exist
            console.log(`Restored at ${state.restoredAt}`)
            break
    }
}
