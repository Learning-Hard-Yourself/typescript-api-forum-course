import type { Database as SQLiteDatabase } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export const runMigrations = async (sqlite: SQLiteDatabase): Promise<void> => {
  const db = drizzle(sqlite, { schema })
  // This will automatically run the migrations from the ./migrations folder
  await migrate(db, { migrationsFolder: './migrations' })
}
