import type { Logger } from '@/app/shared/logging/Logger'
import type { ForumDatabase } from '@/config/database-types'

export interface ApplicationDependencies {
  database: ForumDatabase
  logger?: Logger
}
