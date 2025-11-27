/**
 * Template Literal Types for API Routes.
 * 
 * TypeScript Concepts:
 * - Template literal types - create types from string templates
 * - Uppercase<T>, Lowercase<T>, Capitalize<T>, Uncapitalize<T>
 * - Pattern matching with template literals
 * - Conditional types with infer in template literals
 */

// ============================================
// API Version and Resource Types
// ============================================

export type ApiVersion = 'v1' | 'v2'
export type Resource = 'users' | 'posts' | 'threads' | 'categories' | 'auth' | 'reports'

// Build API route type from version and resource
export type ApiRoute = `/api/${ApiVersion}/${Resource}`

// All possible routes
export type AllApiRoutes = `/api/${ApiVersion}/${Resource}` | `/api/${ApiVersion}/${Resource}/${string}`

// ============================================
// Template Literal Manipulation
// ============================================

// Uppercase transformation
export type UppercaseResource = Uppercase<Resource>
// Result: 'USERS' | 'POSTS' | 'THREADS' | 'CATEGORIES' | 'AUTH' | 'REPORTS'

// Capitalize transformation
export type CapitalizedResource = Capitalize<Resource>
// Result: 'Users' | 'Posts' | 'Threads' | 'Categories' | 'Auth' | 'Reports'

// ============================================
// Event Names from Resources
// ============================================

// Create event names like 'onUsersChange', 'onPostsCreate'
export type EventAction = 'Create' | 'Update' | 'Delete' | 'Change'
export type ResourceEventName = `on${Capitalize<Resource>}${EventAction}`
// Result: 'onUsersCreate' | 'onUsersUpdate' | 'onUsersDelete' | 'onUsersChange' | ...

// ============================================
// HTTP Method Types
// ============================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type LowercaseHttpMethod = Lowercase<HttpMethod>
// Result: 'get' | 'post' | 'put' | 'patch' | 'delete'

// ============================================
// Route Parameter Extraction
// ============================================

/**
 * Extracts route parameters from a path string
 * '/users/:id/posts/:postId' -> 'id' | 'postId'
 */
export type ExtractRouteParams<T extends string> = 
    T extends `${string}:${infer Param}/${infer Rest}`
        ? Param | ExtractRouteParams<`/${Rest}`>
        : T extends `${string}:${infer Param}`
            ? Param
            : never

// Examples - exported for use in route handlers
export type UserPostParams = ExtractRouteParams<'/users/:userId/posts/:postId'>
// Result: 'userId' | 'postId'

export type ThreadParams = ExtractRouteParams<'/threads/:threadId'>
// Result: 'threadId'

/**
 * Creates a params object type from a route
 */
export type RouteParams<T extends string> = {
    [K in ExtractRouteParams<T>]: string
}

// Example: RouteParams<'/users/:userId/posts/:postId'>
// Result: { userId: string; postId: string }

// ============================================
// Predefined Route Types
// ============================================

// User routes
export type UserRoutes = 
    | '/api/v1/users'
    | '/api/v1/users/:id'
    | '/api/v1/users/:id/posts'
    | '/api/v1/users/:id/threads'

// Post routes
export type PostRoutes =
    | '/api/v1/posts'
    | '/api/v1/posts/:id'
    | '/api/v1/posts/:id/replies'
    | '/api/v1/posts/:id/votes'

// Thread routes  
export type ThreadRoutes =
    | '/api/v1/threads'
    | '/api/v1/threads/:id'
    | '/api/v1/threads/:id/posts'

// Auth routes
export type AuthRoutes =
    | '/api/v1/auth/register'
    | '/api/v1/auth/login'
    | '/api/v1/auth/logout'
    | '/api/v1/auth/refresh'
    | '/api/v1/auth/me'

// All routes combined
export type AppRoutes = UserRoutes | PostRoutes | ThreadRoutes | AuthRoutes

// ============================================
// Route Builders
// ============================================

/**
 * Build a user route with ID
 */
export function buildUserRoute(userId: string): `/api/v1/users/${string}` {
    return `/api/v1/users/${userId}`
}

/**
 * Build a post route with ID
 */
export function buildPostRoute(postId: string): `/api/v1/posts/${string}` {
    return `/api/v1/posts/${postId}`
}

/**
 * Build a thread route with ID
 */
export function buildThreadRoute(threadId: string): `/api/v1/threads/${string}` {
    return `/api/v1/threads/${threadId}`
}

// ============================================
// CSS Class Name Pattern
// ============================================

type ComponentName = 'button' | 'card' | 'modal' | 'input'
type Modifier = 'primary' | 'secondary' | 'disabled' | 'loading'
type Size = 'sm' | 'md' | 'lg'

// BEM-like class names
export type ComponentClass = 
    | ComponentName 
    | `${ComponentName}--${Modifier}`
    | `${ComponentName}--${Size}`

// ============================================
// Query String Builder Types
// ============================================

type QueryParam = 'page' | 'limit' | 'sort' | 'order' | 'search'
export type QueryString = `?${QueryParam}=${string}` | `?${QueryParam}=${string}&${string}`

// ============================================
// Validation Patterns
// ============================================

/**
 * Check if a string starts with 'api'
 */
export type IsApiRoute<T extends string> = T extends `/api/${string}` ? true : false

/**
 * Check if route has version
 */
export type HasVersion<T extends string> = T extends `/api/v${number}/${string}` ? true : false

// Type tests - exported for documentation
export type TestIsApiRoute = IsApiRoute<'/api/v1/users'> // true
export type TestIsNotApiRoute = IsApiRoute<'/health'> // false
export type TestHasVersion = HasVersion<'/api/v1/users'> // true
export type TestNoVersion = HasVersion<'/api/users'> // false
