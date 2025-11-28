import type { Logger, LogLevel } from '@/app/shared/interfaces'

export type { Logger, LogLevel }

export interface LoggerConfig {
  readonly name?: string
  readonly level?: LogLevel
}

interface LogEntry {
  readonly message: string
  readonly level: LogLevel
  readonly timestamp: string
  readonly logger?: string
  readonly context?: Record<string, unknown>
}

const logLevelOrder: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

const defaultLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info'

export class ConsoleLogger implements Logger {
  private readonly context: Record<string, unknown>
  private readonly level: LogLevel
  private readonly name?: string

  private constructor(options: { context?: Record<string, unknown>; level?: LogLevel; name?: string }) {
    this.context = options.context ?? {}
    this.level = options.level ?? defaultLevel
    this.name = options.name
  }

  public static create(config: LoggerConfig = {}): ConsoleLogger {
    return new ConsoleLogger({ level: config.level, name: config.name })
  }

  public child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger({
      context: { ...this.context, ...bindings },
      level: this.level,
      name: this.name,
    })
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  public error(error: string | Error, context?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.log('error', error.message, { ...context, stack: error.stack })
      return
    }

    this.log('error', error, context)
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (logLevelOrder[level] > logLevelOrder[this.level]) {
      return
    }

    const combinedContext = { ...this.context, ...context }
    const entry: LogEntry = {
      message,
      level,
      timestamp: new Date().toISOString(),
      logger: this.name,
      context: Object.keys(combinedContext).length > 0 ? combinedContext : undefined,
    }

    const payload = JSON.stringify(entry)

    switch (level) {
      case 'fatal':
      case 'error':
        console.error(payload)
        break
      case 'warn':
        console.warn(payload)
        break
      case 'info':
        console.info(payload)
        break
      default:
        console.debug(payload)
    }
  }
}
