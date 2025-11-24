export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
    id: string
    username: string
    email: string
    displayName: string
    avatarUrl: string | null
    role: UserRole
    createdAt: string
    lastActiveAt: string
}

export interface Profile {
    userId: string
    bio: string | null
    location: string | null
    website: string | null
    twitterHandle: string | null
    githubUsername: string | null
}

export interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    parentId: string | null
    order: number
    createdAt: string
    updatedAt: string
    children?: Category[]
}

export interface Thread {
    id: string
    categoryId: string
    authorId: string
    title: string
    slug: string | null
    isPinned: boolean
    isLocked: boolean
    viewCount: number
    replyCount: number
    lastPostId: string | null
    createdAt: string
    updatedAt: string
    author?: User
    category?: Category
    lastPost?: Post
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
    author?: User
    replies?: Post[]
    attachments?: Attachment[]
}

export interface Attachment {
    id: string
    postId: string
    filename: string
    url: string
    mimeType: string
    size: number
    createdAt: string
}
