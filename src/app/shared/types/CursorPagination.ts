export interface CursorPaginationParams {
    after?: string
    before?: string
    first?: number
    last?: number
}

export interface PageInfo {
    startCursor: string | null
    endCursor: string | null
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export interface Edge<T> {
    node: T
    cursor: string
}

export interface CursorPaginatedResponse<T> {
    edges: Edge<T>[]
    pageInfo: PageInfo
    totalCount?: number
}

export const DEFAULT_CURSOR_PAGINATION = {
    first: 20,
    maxFirst: 100,
} as const

export function encodeCursor(id: string, timestamp: string | Date): string {
    const ts = timestamp instanceof Date ? timestamp.toISOString() : timestamp
    return Buffer.from(`${id}:${ts}`).toString('base64url')
}

export function decodeCursor(cursor: string): { id: string; timestamp: string } | null {
    try {
        const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
        const separatorIndex = decoded.indexOf(':')
        if (separatorIndex === -1) return null
        const id = decoded.slice(0, separatorIndex)
        const timestamp = decoded.slice(separatorIndex + 1)
        if (!id || !timestamp) return null
        return { id, timestamp }
    } catch {
        return null
    }
}

export function createEdges<T extends { id: string; createdAt: string }>(items: T[]): Edge<T>[] {
    return items.map((item) => ({
        node: item,
        cursor: encodeCursor(item.id, item.createdAt),
    }))
}

export function buildPageInfo<T>(
    edges: Edge<T>[],
    hasNextPage: boolean,
    hasPreviousPage: boolean,
): PageInfo {
    const firstEdge = edges[0]
    const lastEdge = edges[edges.length - 1]
    return {
        startCursor: firstEdge?.cursor ?? null,
        endCursor: lastEdge?.cursor ?? null,
        hasNextPage,
        hasPreviousPage,
    }
}

export function validateCursorParams(params: CursorPaginationParams): {
    limit: number
    direction: 'forward' | 'backward'
    cursor?: { id: string; timestamp: string }
} {
    const { after, before, first, last } = params
    const direction = before || last ? 'backward' : 'forward'
    let limit = direction === 'forward'
        ? (first ?? DEFAULT_CURSOR_PAGINATION.first)
        : (last ?? DEFAULT_CURSOR_PAGINATION.first)
    limit = Math.min(limit, DEFAULT_CURSOR_PAGINATION.maxFirst)
    limit = Math.max(1, limit)
    const cursorString = direction === 'forward' ? after : before
    const cursor = cursorString ? decodeCursor(cursorString) ?? undefined : undefined
    return { limit, direction, cursor }
}
