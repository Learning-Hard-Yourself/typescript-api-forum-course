import { ModerationAction } from './ModerationAction'

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

export function isEditAction(action: ModerationAction): action is EditPostAction {
    return action instanceof EditPostAction
}
