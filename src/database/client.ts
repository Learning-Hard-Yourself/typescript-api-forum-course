import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import { schema } from '@/database/schema'
import type { ForumDatabase } from '@/database/types'

export interface DatabaseConnection {
  sqlite: Database.Database
  database: ForumDatabase
}

export const createDatabase = (filePath: string): DatabaseConnection => {
  const sqlite = new Database(filePath)
  const database = drizzle(sqlite, { schema })
  return { sqlite, database }
}
