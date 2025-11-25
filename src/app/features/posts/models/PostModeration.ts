

import type { Post } from '@/types'

export type EditHistoryEntry = [
    timestamp: string,
    editorId: string,
    previousContent: string,
    newContent: string,
    reason: string | null,
]

const exampleEdit: EditHistoryEntry = [
    '2024-03-20T12:00:00Z',
    'usr_123',
    'Old content',
    'New content',
    'Fixed typo',
]

const timestamp: string = exampleEdit[0]
const editorId: string = exampleEdit[1]

export type ModerationEvent = [action: 'edit' | 'delete' | 'restore', targetId: string, moderatorId: string, reason?: string]

export type ReadonlyEditEntry = readonly [string, string, string, string, string | null]

const regularArray: string[] = ['a', 'b', 'c']
regularArray.push('d')

const tuple: [string, number] = ['a', 1]

export type EditTimestamp = EditHistoryEntry[0]
export type EditorId = EditHistoryEntry[1]
export type PreviousContent = EditHistoryEntry[2]

export type TupleElement<T extends readonly unknown[]> = T[number]

type AnyEditField = TupleElement<EditHistoryEntry>

export type TupleLength<T extends readonly unknown[]> = T['length']
type EditEntryLength = TupleLength<EditHistoryEntry>

export type PostStatus =
    | 'active'
    | 'edited'
    | 'deleted'
    | 'deleted_by_author'
    | 'deleted_by_moderator'
    | 'restored'

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

export interface PostWithHistory extends Post {
    editHistory: EditHistoryEntry[]
    editCount: number
}

export interface PostEdit {
    id: string
    postId: string
    editorId: string
    previousContent: string
    newContent: string
    editReason: string | null
    createdAt: string
}

export function isDeletedPost(
    post: Post,
): post is Post & { deletedAt: string; deletedBy: string } {
    return post.isDeleted === true && post.deletedAt != null && post.deletedBy != null
}

export function isEditedPost(post: Post): post is Post & { isEdited: true } {
    return post.isEdited === true
}

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

export function createEditHistoryEntry(edit: PostEdit): EditHistoryEntry {
    return [edit.createdAt, edit.editorId, edit.previousContent, edit.newContent, edit.editReason]
}

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

export function isSameEdit(a: EditHistoryEntry, b: EditHistoryEntry): boolean {
    return (
        a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[3] === b[3] &&
        a[4] === b[4]
    )
}

function getEditInfo(edit: PostEdit): [string, number, number] {
    const contentLength = edit.newContent.length
    const diff = edit.newContent.length - edit.previousContent.length

    return [edit.createdAt, contentLength, diff]
}

const [editTime, length, difference] = getEditInfo({
    id: '1',
    postId: 'p1',
    editorId: 'u1',
    previousContent: 'old',
    newContent: 'new content',
    editReason: null,
    createdAt: '2024-03-20',
})

function handleModerationState(state: PostModerationState) {
    switch (state.status) {
        case 'active':

            console.log('Post is active:', state.post.id)
            break

        case 'edited':

            console.log(`Post edited ${state.editCount} times`)
            break

        case 'deleted':

            console.log(`Deleted at ${state.deletedAt} by ${state.deletedBy}`)
            break

        case 'restored':

            console.log(`Restored at ${state.restoredAt}`)
            break
    }
}
