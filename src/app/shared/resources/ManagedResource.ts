/**
 * Managed resources with automatic cleanup using TS 5.2+ `using` declarations.
 * Barrel file re-exporting concrete resource implementations.
 */

export { CacheEntry } from './CacheEntry'
export { RateLimitToken } from './RateLimitToken'
export { RequestContext, type RequestMetrics } from './RequestContext'
export { ResourceLock } from './ResourceLock'

