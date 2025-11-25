

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in'

export interface Filter {
    field: string
    operator: FilterOperator
    value: unknown
}

export class FilterBuilder<T> {
    private filters: Filter[] = []


    public where<K extends keyof T>(field: K, operator: FilterOperator, value: T[K]): this {
        this.filters.push({
            field: field as string,
            operator,
            value,
        })
        return this
    }


    public whereEquals<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'eq', value)
    }


    public whereNotEquals<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'ne', value)
    }


    public whereIn<K extends keyof T>(field: K, values: T[K][]): this {
        this.filters.push({
            field: field as string,
            operator: 'in',
            value: values,
        })
        return this
    }


    public whereLike<K extends keyof T>(field: K, pattern: string): this {
        this.filters.push({
            field: field as string,
            operator: 'like',
            value: pattern,
        })
        return this
    }


    public whereGreaterThan<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'gt', value)
    }


    public whereLessThan<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'lt', value)
    }


    public whereGreaterThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'gte', value)
    }


    public whereLessThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'lte', value)
    }


    public build(): Filter[] {
        return [...this.filters]
    }


    public count(): number {
        return this.filters.length
    }


    public hasFilters(): boolean {
        return this.filters.length > 0
    }


    public reset(): this {
        this.filters = []
        return this
    }


    public getFilter(index: number): Filter | undefined {
        return this.filters[index]
    }
}

export function createFilterBuilder<T>(): FilterBuilder<T> {
    return new FilterBuilder<T>()
}
