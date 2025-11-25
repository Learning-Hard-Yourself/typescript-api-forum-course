export abstract class ApplicationError extends Error {
  public abstract readonly statusCode: number
  public readonly context?: Record<string, unknown>

  protected constructor(message: string, context?: Record<string, unknown>) {
    super(message)
    this.context = context
  }
}
