export interface JsonResponse<T> {
    data: T
}

export interface JsonCollectionResponse<T> {
    data: T[]
    meta?: Record<string, unknown>
}

export abstract class JsonResource<TModel, TOutput> {
    constructor(protected readonly resource: TModel) {}

    abstract toArray(): TOutput

    toResponse(): JsonResponse<TOutput> {
        return { data: this.toArray() }
    }

    static collection<TModel, TOutput>(
        items: TModel[],
        ResourceClass: new (resource: TModel) => JsonResource<TModel, TOutput>,
    ): JsonCollectionResponse<TOutput> {
        return {
            data: items.map((item) => new ResourceClass(item).toArray()),
        }
    }

    static collectionWithMeta<TModel, TOutput>(
        items: TModel[],
        ResourceClass: new (resource: TModel) => JsonResource<TModel, TOutput>,
        meta: Record<string, unknown>,
    ): JsonCollectionResponse<TOutput> {
        return {
            data: items.map((item) => new ResourceClass(item).toArray()),
            meta,
        }
    }
}

export function jsonResource<T>(data: T): JsonResponse<T> {
    return { data }
}

export function jsonCollection<T>(data: T[], meta?: Record<string, unknown>): JsonCollectionResponse<T> {
    return meta ? { data, meta } : { data }
}
