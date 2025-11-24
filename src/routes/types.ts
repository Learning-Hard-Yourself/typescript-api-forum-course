import type { Logger } from '@/app/Logging/Logger'
import type { ForumDatabase } from '@/database/types'

export interface ApplicationDependencies {
  database: ForumDatabase
  logger?: Logger
}
