import { ModerationAction } from './ModerationAction'

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

export function isDeleteAction(action: ModerationAction): action is DeletePostAction {
    return action instanceof DeletePostAction
}
