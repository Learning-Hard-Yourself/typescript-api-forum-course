import type { Database as SQLiteDatabase } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as fs from 'fs'
import * as path from 'path'
import * as schema from './schema'

export const runMigrations = async (sqlite: SQLiteDatabase): Promise<void> => {
  const db = drizzle(sqlite, { schema })

  // Check if migrations folder exists
  const migrationsPath = path.join(process.cwd(), 'migrations')

  if (fs.existsSync(migrationsPath)) {
    // Run migrations if folder exists
    // Use absolute path to ensure it works regardless of CWD
    await migrate(db, { migrationsFolder: migrationsPath })
  } else {
    console.log('No migrations folder found, skipping migrations')
  }
}
