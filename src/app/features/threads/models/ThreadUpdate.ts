import type { Thread } from '@/types'

export type UserRole = 'user' | 'moderator' | 'admin'

export const USER_ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
} as const

export type ThreadUpdatePayload = Partial<{
    title: string
    isPinned: boolean
    isLocked: boolean
}>

export type UserEditableFields = Pick<ThreadUpdatePayload, 'title'>

export type AdminOnlyFields = Omit<ThreadUpdatePayload, keyof UserEditableFields>

export type ThreadCreationPayload = Required<Pick<Thread, 'title' | 'categoryId' | 'authorId'>>

export type AllowedUpdate<TRole extends UserRole> = TRole extends 'admin' | 'moderator'
    ? ThreadUpdatePayload
    : UserEditableFields

export type CanModifyAdminFields<TRole extends UserRole> = TRole extends 'admin' | 'moderator'
    ? true
    : false

export interface ThreadMetadata {
    [key: string]: string | number | boolean | string[] | undefined
    viewCount?: number
    lastActivity?: string
    tags?: string[]
    customField?: string
}

export interface ThreadWithMetadata extends Thread {
    metadata: ThreadMetadata
}

export function isAdminOrModerator(role: UserRole): role is 'admin' | 'moderator' {
    return role === 'admin' || role === 'moderator'
}

export function isAdmin(role: UserRole): role is 'admin' {
    return role === 'admin'
}

export function isValidUserRole(value: unknown): value is UserRole {
    return value === 'user' || value === 'moderator' || value === 'admin'
}

export function assertValidUpdate(update: unknown): asserts update is ThreadUpdatePayload {
    if (typeof update !== 'object' || update === null) {
        throw new Error('Invalid update: must be an object')
    }

    const payload = update as Record<string, unknown>

    if ('title' in payload && typeof payload.title !== 'string') {
        throw new Error('Invalid update: title must be a string')
    }

    if ('isPinned' in payload && typeof payload.isPinned !== 'boolean') {
        throw new Error('Invalid update: isPinned must be a boolean')
    }

    if ('isLocked' in payload && typeof payload.isLocked !== 'boolean') {
        throw new Error('Invalid update: isLocked must be a boolean')
    }
}

export function assertCanUpdate(
    role: UserRole,
    update: ThreadUpdatePayload,
    isAuthor: boolean,
): void {

    const hasAdminFields = 'isPinned' in update || 'isLocked' in update

    if (hasAdminFields && !isAdminOrModerator(role)) {
        throw new Error('Only admins and moderators can pin or lock threads')
    }

    if (!hasAdminFields && !isAuthor && !isAdminOrModerator(role)) {
        throw new Error('Only thread authors can update their threads')
    }
}

export function assertIsAdminOrModerator(role: UserRole): asserts role is 'admin' | 'moderator' {
    if (!isAdminOrModerator(role)) {
        throw new Error('This action requires admin or moderator permissions')
    }
}

export function filterUpdateByRole<TRole extends UserRole>(
    role: TRole,
    update: ThreadUpdatePayload,
): AllowedUpdate<TRole> {
    if (isAdminOrModerator(role)) {

        return update as AllowedUpdate<TRole>
    }

    const { title } = update
    return { title } as AllowedUpdate<TRole>
}

export function hasOnlyUserEditableFields(update: ThreadUpdatePayload): boolean {
    const userEditableKeys: Array<keyof UserEditableFields> = ['title']
    const updateKeys = Object.keys(update) as Array<keyof ThreadUpdatePayload>

    return updateKeys.every((key) => userEditableKeys.includes(key as keyof UserEditableFields))
}

export function hasAdminOnlyFields(update: ThreadUpdatePayload): boolean {
    return 'isPinned' in update || 'isLocked' in update
}
