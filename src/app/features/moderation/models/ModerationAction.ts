

const MODERATION_METADATA = Symbol('moderation-metadata')
const ACTION_TIMESTAMP = Symbol('action-timestamp')
const ACTION_ID = Symbol('action-id')

const symbol1 = Symbol('test')
const symbol2 = Symbol('test')
console.assert(symbol1 !== symbol2, 'Symbols with same description are different')

export abstract class ModerationAction {

    private [MODERATION_METADATA]: Record<string, unknown> = {}
    private [ACTION_TIMESTAMP]: string
    private [ACTION_ID]: string


    constructor(
        public readonly actionType: string,
        public readonly targetId: string,
        public readonly moderatorId: string,
        public readonly reason?: string,
    ) {
        this[ACTION_TIMESTAMP] = new Date().toISOString()
        this[ACTION_ID] = `${actionType}_${Date.now()}`

        this.setMetadata('initialized', true)
    }


    abstract execute(): Promise<void>


    abstract validate(): Promise<boolean>


    public log(): void {
        console.log(`[MODERATION] ${this.actionType} on ${this.targetId}`, {
            moderator: this.moderatorId,
            timestamp: this[ACTION_TIMESTAMP],
            actionId: this[ACTION_ID],
            reason: this.reason,
        })
    }


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


    protected async beforeExecute(): Promise<void> {

    }

    protected async afterExecute(): Promise<void> {

    }

    protected async notify(): Promise<void> {

        console.log(`Moderation action ${this.actionType} completed`)

    }
}

export class EditPostAction extends ModerationAction {
    constructor(
        postId: string,
        moderatorId: string,
        public readonly newContent: string,
        public readonly previousContent: string,
        reason?: string,
    ) {
        super('EDIT_POST', postId, moderatorId, reason)

        this.setMetadata('contentLength', newContent.length)
        this.setMetadata('previousLength', previousContent.length)
    }


    async execute(): Promise<void> {
        console.log(`Editing post ${this.targetId}`)
        console.log(`Old: ${this.previousContent.substring(0, 50)}...`)
        console.log(`New: ${this.newContent.substring(0, 50)}...`)

        this.setMetadata('executed', true)
    }


    async validate(): Promise<boolean> {

        if (!this.newContent || this.newContent.trim().length === 0) {
            return false
        }

        if (this.newContent === this.previousContent) {
            console.warn('Content unchanged')
            return false
        }

        return true
    }


    protected override async notify(): Promise<void> {
        console.log(`Post ${this.targetId} edited by ${this.moderatorId}`)

    }


    public getContentDiff(): { added: number; removed: number } {
        const oldLength = this.previousContent.length
        const newLength = this.newContent.length

        return {
            added: Math.max(0, newLength - oldLength),
            removed: Math.max(0, oldLength - newLength),
        }
    }
}

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

        this.setMetadata('executed', true)
        this.setMetadata('deletedAt', new Date().toISOString())
    }

    async validate(): Promise<boolean> {

        return true
    }

    protected override async notify(): Promise<void> {
        const deleteType = this.isSoftDelete ? 'hidden' : 'permanently deleted'
        console.log(`Post ${this.targetId} has been ${deleteType}`)

    }
}

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

        return true
    }

    protected override async notify(): Promise<void> {
        console.log(`Post ${this.targetId} has been restored`)
    }
}

export function isEditAction(action: ModerationAction): action is EditPostAction {
    return action instanceof EditPostAction
}

export function isDeleteAction(action: ModerationAction): action is DeletePostAction {
    return action instanceof DeletePostAction
}

export function isRestoreAction(action: ModerationAction): action is RestorePostAction {
    return action instanceof RestorePostAction
}

async function exampleUsage() {

    const editAction = new EditPostAction(
        'post_123',
        'mod_456',
        'Updated content',
        'Original content',
        'Fixed typo',
    )

    const deleteAction = new DeletePostAction('post_789', 'mod_456', true, 'Spam')

    const actions: ModerationAction[] = [editAction, deleteAction]

    for (const action of actions) {

        await action.perform()

        action.log()

        if (isEditAction(action)) {

            const diff = action.getContentDiff()
            console.log('Content diff:', diff)
        }
    }
}

const action = new EditPostAction('post_1', 'mod_1', 'new', 'old')
console.log(Object.keys(action))
console.log(JSON.stringify(action))
