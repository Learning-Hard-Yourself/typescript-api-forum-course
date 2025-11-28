export interface ReadRepository<TEntity, TId = string> {
    findById(id: TId): Promise<TEntity | null>
    findAll(): Promise<TEntity[]>
}


export interface WriteRepository<TEntity, TId = string> {
    save(entity: Omit<TEntity, 'id'>): Promise<TEntity>
    update(id: TId, entity: Partial<TEntity>): Promise<TEntity>
    delete(id: TId): Promise<void>
}


export interface Repository<TEntity, TId = string>
    extends ReadRepository<TEntity, TId>,
        WriteRepository<TEntity, TId> {}
