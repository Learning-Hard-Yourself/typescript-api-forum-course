/**
 * Filter Builder
 *
 * Demonstrates:
 * - Builder Pattern with method chaining
 * - Fluent API design for complex object construction
 * - Type-safe filter construction
 *
 * Educational Focus:
 * The Builder Pattern is a creational design pattern that allows
 * constructing complex objects step by step. By returning 'this'
 * from each method, we enable method chaining for a fluent API.
 */

// ================================
// FILTER TYPES
// ================================

/**
 * Filter operators
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in'

/**
 * Single filter condition
 */
export interface Filter {
    field: string
    operator: FilterOperator
    value: unknown
}

// ================================
// BUILDER PATTERN
// ================================

/**
 * Builder pattern for constructing complex filters
 *
 * Learning: The Builder Pattern provides a fluent interface for
 * creating objects. Each method returns 'this', allowing you to
 * chain multiple method calls together.
 *
 * Example usage:
 * ```typescript
 * const filters = new FilterBuilder<Thread>()
 *   .where('categoryId', 'eq', 'cat_123')
 *   .where('isPinned', 'eq', true)
 *   .whereIn('authorId', ['usr_1', 'usr_2'])
 *   .build()
 * ```
 *
 * Benefits:
 * - Readable, self-documenting code
 * - Type-safe field names (T constrains which fields exist)
 * - Flexible order of operations
 * - Easy to extend with new methods
 *
 * @template T - The entity type being filtered
 */
export class FilterBuilder<T> {
    private filters: Filter[] = []

    /**
     * Add a filter condition
     *
     * Learning: By returning 'this', we enable method chaining!
     * TypeScript ensures K is a valid key of T, preventing typos.
     *
     * @param field - Field name (must be a key of T)
     * @param operator - Comparison operator
     * @param value - Value to compare against
     * @returns this for method chaining
     */
    public where<K extends keyof T>(field: K, operator: FilterOperator, value: T[K]): this {
        this.filters.push({
            field: field as string,
            operator,
            value,
        })
        return this // Enable chaining!
    }

    /**
     * Add an equality filter (shorthand for where with 'eq')
     *
     * @param field - Field name
     * @param value - Value to match
     * @returns this for method chaining
     */
    public whereEquals<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'eq', value)
    }

    /**
     * Add a not-equal filter (shorthand)
     *
     * @param field - Field name
     * @param value - Value to exclude
     * @returns this for method chaining
     */
    public whereNotEquals<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'ne', value)
    }

    /**
     * Add an IN filter for matching multiple values
     *
     * Learning: This shows how generics preserve type relationships.
     * If T[K] is string, then values must be string[], not number[]!
     *
     * @param field - Field name
     * @param values - Array of values to match
     * @returns this for method chaining
     */
    public whereIn<K extends keyof T>(field: K, values: T[K][]): this {
        this.filters.push({
            field: field as string,
            operator: 'in',
            value: values,
        })
        return this
    }

    /**
     * Add a LIKE filter for partial text matching
     *
     * @param field - Field name (should be string type)
     * @param pattern - Pattern to match (use % for wildcards)
     * @returns this for method chaining
     */
    public whereLike<K extends keyof T>(field: K, pattern: string): this {
        this.filters.push({
            field: field as string,
            operator: 'like',
            value: pattern,
        })
        return this
    }

    /**
     * Add a greater-than filter
     *
     * @param field - Field name
     * @param value - Minimum value (exclusive)
     * @returns this for method chaining
     */
    public whereGreaterThan<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'gt', value)
    }

    /**
     * Add a less-than filter
     *
     * @param field - Field name
     * @param value - Maximum value (exclusive)
     * @returns this for method chaining
     */
    public whereLessThan<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'lt', value)
    }

    /**
     * Add a greater-than-or-equal filter
     *
     * @param field - Field name
     * @param value - Minimum value (inclusive)
     * @returns this for method chaining
     */
    public whereGreaterThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'gte', value)
    }

    /**
     * Add a less-than-or-equal filter
     *
     * @param field - Field name
     * @param value - Maximum value (inclusive)
     * @returns this for method chaining
     */
    public whereLessThanOrEqual<K extends keyof T>(field: K, value: T[K]): this {
        return this.where(field, 'lte', value)
    }

    /**
     * Build the final filter array
     *
     * Learning: This is the terminal method that returns the
     * constructed object. We return a copy to prevent external
     * mutation of internal state.
     *
     * @returns Array of filters
     */
    public build(): Filter[] {
        return [...this.filters]
    }

    /**
     * Get count of filters
     *
     * @returns Number of filters added
     */
    public count(): number {
        return this.filters.length
    }

    /**
     * Check if any filters have been added
     *
     * @returns true if builder has filters
     */
    public hasFilters(): boolean {
        return this.filters.length > 0
    }

    /**
     * Reset all filters
     *
     * @returns this for method chaining
     */
    public reset(): this {
        this.filters = []
        return this
    }

    /**
     * Get a specific filter by index
     *
     * @param index - Filter index
     * @returns Filter at index or undefined
     */
    public getFilter(index: number): Filter | undefined {
        return this.filters[index]
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Create a new filter builder
 *
 * Learning: This is a factory function that provides a cleaner
 * syntax than using 'new FilterBuilder()'.
 *
 * Example:
 * const filters = createFilterBuilder<Thread>()
 *   .whereEquals('isPinned', true)
 *   .build()
 *
 * @returns New FilterBuilder instance
 */
export function createFilterBuilder<T>(): FilterBuilder<T> {
    return new FilterBuilder<T>()
}
