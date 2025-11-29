export interface PostEdit {
    id: string
    postId: string
    editorId: string
    previousContent: string
    newContent: string
    editReason: string | null
    createdAt: string
}


export interface PostEditRepository {
    findByPostId(postId: string): Promise<PostEdit[]>
    save(edit: Omit<PostEdit, 'id'>): Promise<PostEdit>
}
