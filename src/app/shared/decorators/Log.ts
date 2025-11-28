/**
 * Method Decorators for logging.
 * 
 * TypeScript Concept: Decorators
 * - Decorators are special functions that can modify classes, methods, properties
 * - Method decorators receive: target, propertyKey, descriptor
 * - They can wrap the original method to add behavior
 * - Requires experimentalDecorators: true in tsconfig.json
 */

import { ConsoleLogger } from '@/app/shared/logging/Logger'

const logger = ConsoleLogger.create({ name: 'decorator' })

/**
 * @Log decorator - logs method entry and exit with timing
 * 
 * Usage:
 * class UserService {
 *     @Log
 *     async findById(id: string) { ... }
 * }
 */
export function Log(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
        const className = target.constructor.name
        const methodName = String(propertyKey)
        const startTime = performance.now()

        logger.debug(`Entering ${className}.${methodName}`, {
            args: args.map(arg => 
                typeof arg === 'object' ? '[Object]' : String(arg)
            ),
        })

        try {
            const result = await originalMethod.apply(this, args)
            const duration = performance.now() - startTime

            logger.debug(`Exiting ${className}.${methodName}`, {
                durationMs: duration.toFixed(2),
                success: true,
            })

            return result
        } catch (error) {
            const duration = performance.now() - startTime

            logger.error(`Error in ${className}.${methodName}`, {
                durationMs: duration.toFixed(2),
                error: error instanceof Error ? error.message : String(error),
            })

            throw error
        }
    }

    return descriptor
}

/**
 * @LogSync decorator - for synchronous methods
 */
export function LogSync(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
        const className = target.constructor.name
        const methodName = String(propertyKey)
        const startTime = performance.now()

        logger.debug(`Entering ${className}.${methodName}`, {
            args: args.map(arg => 
                typeof arg === 'object' ? '[Object]' : String(arg)
            ),
        })

        try {
            const result = originalMethod.apply(this, args)
            const duration = performance.now() - startTime

            logger.debug(`Exiting ${className}.${methodName}`, {
                durationMs: duration.toFixed(2),
                success: true,
            })

            return result
        } catch (error) {
            const duration = performance.now() - startTime

            logger.error(`Error in ${className}.${methodName}`, {
                durationMs: duration.toFixed(2),
                error: error instanceof Error ? error.message : String(error),
            })

            throw error
        }
    }

    return descriptor
}

/**
 * @LogLevel decorator factory - logs with specific level
 * 
 * Usage:
 * @LogLevel('info')
 * async createUser() { ... }
 */
export function LogLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    return function (
        target: object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value

        descriptor.value = async function (...args: unknown[]) {
            const className = target.constructor.name
            const methodName = String(propertyKey)

            const logFn = level === 'error' 
                ? logger.error.bind(logger)
                : level === 'warn'
                ? logger.warn.bind(logger)
                : level === 'info'
                ? logger.info.bind(logger)
                : logger.debug.bind(logger)

            logFn(`${className}.${methodName} called`, {
                args: args.length,
            })

            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}
