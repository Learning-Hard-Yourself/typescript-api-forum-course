export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug'

export interface Logger {
    info(message: string, context?: Record<string, unknown>): void
    warn(message: string, context?: Record<string, unknown>): void
    error(error: string | Error, context?: Record<string, unknown>): void
    debug(message: string, context?: Record<string, unknown>): void
    child(bindings: Record<string, unknown>): Logger
}
