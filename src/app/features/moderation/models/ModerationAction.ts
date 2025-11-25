/**
 * Moderation Action Models
 *
 * Demonstrates:
 * - Abstract Classes for shared behavior and contracts
 * - Symbol Types for truly private properties
 * - Template Method pattern
 *
 * Educational Focus:
 * This file shows how abstract classes provide a foundation for
 * inheritance-based polymorphism in TypeScript, and how Symbols
 * create truly private properties that can't be accessed externally.
 */

// ================================
// SYMBOL TYPES
// ================================

/**
 * Symbols create truly unique property keys
 *
 * Learning: Symbols are primitive values that are guaranteed to be
 * unique. Even if you create another symbol with the same description,
 * they will NOT be equal.
 *
 * Use cases:
 * - Truly private properties (can't be accessed via Object.keys())
 * - Internal metadata that shouldn't leak to JSON
 * - Preventing property name collisions
 */
const MODERATION_METADATA = Symbol('moderation-metadata')
const ACTION_TIMESTAMP = Symbol('action-timestamp')
const ACTION_ID = Symbol('action-id')

/**
 * Example: Symbols are unique!
 */
const symbol1 = Symbol('test')
const symbol2 = Symbol('test')
console.assert(symbol1 !== symbol2, 'Symbols with same description are different')

// ================================
// ABSTRACT CLASSES
// ================================

/**
 * Abstract base class for all moderation actions
 *
 * Learning: Abstract classes provide:
 * 1. Shared implementation (concrete methods)
 * 2. Contract enforcement (abstract methods)
 * 3. Runtime validation (can use instanceof)
 * 4. Constructor logic
 *
 * Differences from interfaces:
 * - Interfaces: Pure type contracts, no implementation, no runtime
 * - Abstract classes: Can have implementation, exists at runtime
 *
 * When to use abstract classes:
 * - Need shared logic between subclasses
 * - Want to enforce implementation of certain methods
 * - Template method pattern
 * - Need instanceof checks
 */
export abstract class ModerationAction {
    // Symbol-based truly private properties
    // These won't show in Object.keys() or JSON.stringify()!
    private [MODERATION_METADATA]: Record<string, unknown> = {}
    private [ACTION_TIMESTAMP]: string
    private [ACTION_ID]: string

    /**
     * Constructor can have logic (unlike interfaces!)
     */
    constructor(
        public readonly actionType: string,
        public readonly targetId: string,
        public readonly moderatorId: string,
        public readonly reason?: string,
    ) {
        this[ACTION_TIMESTAMP] = new Date().toISOString()
        this[ACTION_ID] = `${actionType}_${Date.now()}`

        // Can add initialization logic
        this.setMetadata('initialized', true)
    }

    /**
     * Abstract method - MUST be implemented by ALL subclasses
     *
     * Learning: Abstract methods:
     * - Have no implementation in base class
     * - MUST be implemented in concrete subclasses
     * - Compiler enforces implementation
     * - Can have different return types in subclasses (covariant)
     */
    abstract execute(): Promise<void>

    /**
     * Abstract method with return type
     */
    abstract validate(): Promise<boolean>

    /**
     * Concrete method - shared by all subclasses
     *
     * Learning: Concrete methods in abstract classes provide
     * shared functionality without forcing subclasses to reimplement
     */
    public log(): void {
        console.log(`[MODERATION] ${this.actionType} on ${this.targetId}`, {
            moderator: this.moderatorId,
            timestamp: this[ACTION_TIMESTAMP],
            actionId: this[ACTION_ID],
            reason: this.reason,
        })
    }

    /**
     * Access symbol-based properties
     * Only accessible within class and subclasses (protected)
     */
    protected setMetadata(key: string, value: unknown): void {
        this[MODERATION_METADATA][key] = value
    }

    protected getMetadata(key: string): unknown {
        return this[MODERATION_METADATA][key]
    }

    protected getTimestamp(): string {
        return this[ACTION_TIMESTAMP]
    }

    protected getActionId(): string {
        return this[ACTION_ID]
    }

    /**
     * Template Method Pattern
     *
     * Learning: Defines algorithm skeleton, letting subclasses
     * override specific steps without changing the structure.
     *
     * The 'perform' method is the template - it defines the
     * overall flow, while letting subclasses customize each step.
     */
    public async perform(): Promise<void> {
        this.log()

        const isValid = await this.validate()
        if (!isValid) {
            throw new Error(`Invalid moderation action: ${this.actionType}`)
        }

        await this.beforeExecute()
        await this.execute()
        await this.afterExecute()
        await this.notify()
    }

    /**
     * Hook methods for template pattern
     * Subclasses can override these for custom behavior
     */
    protected async beforeExecute(): Promise<void> {
        // Default: do nothing
        // Subclasses can override for pre-execution logic
    }

    protected async afterExecute(): Promise<void> {
        // Default: do nothing
        // Subclasses can override for post-execution logic
    }

    protected async notify(): Promise<void> {
        // Default implementation
        console.log(`Moderation action ${this.actionType} completed`)
        // Subclasses can override to send notifications
    }
}

// ================================
// CONCRETE IMPLEMENTATIONS
// ================================

/**
 * Concrete class: Edit Post Action
 *
 * Learning: Concrete classes:
 * - Extend abstract class
 * - MUST implement all abstract methods
 * - Can add their own methods and properties
 * - Can override concrete methods for customization
 */
export class EditPostAction extends ModerationAction {
    constructor(
        postId: string,
        moderatorId: string,
        public readonly newContent: string,
        public readonly previousContent: string,
        reason?: string,
    ) {
        super('EDIT_POST', postId, moderatorId, reason)

        // Store additional metadata using symbol-based storage
        this.setMetadata('contentLength', newContent.length)
        this.setMetadata('previousLength', previousContent.length)
    }

    /**
     * Implement abstract execute method
     */
    async execute(): Promise<void> {
        console.log(`Editing post ${this.targetId}`)
        console.log(`Old: ${this.previousContent.substring(0, 50)}...`)
        console.log(`New: ${this.newContent.substring(0, 50)}...`)

        // Actual implementation would update database
        this.setMetadata('executed', true)
    }

    /**
     * Implement abstract validate method
     */
    async validate(): Promise<boolean> {
        // Validate content not empty
        if (!this.newContent || this.newContent.trim().length === 0) {
            return false
        }

        // Validate content different from previous
        if (this.newContent === this.previousContent) {
            console.warn('Content unchanged')
            return false
        }

        return true
    }

    /**
     * Override hook for custom behavior
     */
    protected override async notify(): Promise<void> {
        console.log(`Post ${this.targetId} edited by ${this.moderatorId}`)
        // Could send notification to post author
    }

    /**
     * Custom method specific to edit action
     */
    public getContentDiff(): { added: number; removed: number } {
        const oldLength = this.previousContent.length
        const newLength = this.newContent.length

        return {
            added: Math.max(0, newLength - oldLength),
            removed: Math.max(0, oldLength - newLength),
        }
    }
}

/**
 * Concrete class: Delete Post Action
 */
export class DeletePostAction extends ModerationAction {
    constructor(
        postId: string,
        moderatorId: string,
        public readonly isSoftDelete: boolean = true,
        reason?: string,
    ) {
        super('DELETE_POST', postId, moderatorId, reason)
        this.setMetadata('softDelete', isSoftDelete)
    }

    async execute(): Promise<void> {
        const deleteType = this.isSoftDelete ? 'soft delete' : 'hard delete'
        console.log(`Performing ${deleteType} on post ${this.targetId}`)

        // Actual implementation would update database
        this.setMetadata('executed', true)
        this.setMetadata('deletedAt', new Date().toISOString())
    }

    async validate(): Promise<boolean> {
        // Check if post exists (would query database)
        // For now, always valid
        return true
    }

    protected override async notify(): Promise<void> {
        const deleteType = this.isSoftDelete ? 'hidden' : 'permanently deleted'
        console.log(`Post ${this.targetId} has been ${deleteType}`)
        // Could notify post author and moderators
    }
}

/**
 * Concrete class: Restore Post Action
 */
export class RestorePostAction extends ModerationAction {
    constructor(postId: string, moderatorId: string, reason?: string) {
        super('RESTORE_POST', postId, moderatorId, reason)
    }

    async execute(): Promise<void> {
        console.log(`Restoring post ${this.targetId}`)
        this.setMetadata('executed', true)
        this.setMetadata('restoredAt', new Date().toISOString())
    }

    async validate(): Promise<boolean> {
        // Check if post was deleted (would query database)
        return true
    }

    protected override async notify(): Promise<void> {
        console.log(`Post ${this.targetId} has been restored`)
    }
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for checking moderation action type
 */
export function isEditAction(action: ModerationAction): action is EditPostAction {
    return action instanceof EditPostAction
}

export function isDeleteAction(action: ModerationAction): action is DeletePostAction {
    return action instanceof DeletePostAction
}

export function isRestoreAction(action: ModerationAction): action is RestorePostAction {
    return action instanceof RestorePostAction
}

// ================================
// USAGE EXAMPLES
// ================================

/**
 * Example: Using abstract classes
 */
async function exampleUsage() {
    // Create concrete instances
    const editAction = new EditPostAction(
        'post_123',
        'mod_456',
        'Updated content',
        'Original content',
        'Fixed typo',
    )

    const deleteAction = new DeletePostAction('post_789', 'mod_456', true, 'Spam')

    // Polymorphism: treat all as ModerationAction
    const actions: ModerationAction[] = [editAction, deleteAction]

    for (const action of actions) {
        // Use template method
        await action.perform()

        // Log is shared method
        action.log()

        // Type narrowing with type guards
        if (isEditAction(action)) {
            // TypeScript knows it's EditPostAction!
            const diff = action.getContentDiff()
            console.log('Content diff:', diff)
        }
    }
}

// Symbol-based properties are truly private
const action = new EditPostAction('post_1', 'mod_1', 'new', 'old')
console.log(Object.keys(action)) // Won't show symbol properties!
console.log(JSON.stringify(action)) // Won't include symbol properties!
