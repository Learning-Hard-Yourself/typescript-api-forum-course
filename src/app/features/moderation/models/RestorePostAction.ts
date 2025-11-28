import { ModerationAction } from './ModerationAction'

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

export function isRestoreAction(action: ModerationAction): action is RestorePostAction {
    return action instanceof RestorePostAction
}
