const MODERATION_METADATA = Symbol('moderation-metadata')
const ACTION_TIMESTAMP = Symbol('action-timestamp')
const ACTION_ID = Symbol('action-id')

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

    protected async beforeExecute(): Promise<void> {}
    protected async afterExecute(): Promise<void> {}

    protected async notify(): Promise<void> {
        console.log(`Moderation action ${this.actionType} completed`)
    }
}
