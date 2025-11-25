import type { Database as SQLiteDatabase } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as fs from 'fs'
import * as path from 'path'
import * as schema from './schema'

export const runMigrations = async (sqlite: SQLiteDatabase): Promise<void> => {
  const db = drizzle(sqlite, { schema })

  const migrationsPath = path.join(process.cwd(), 'migrations')

  if (fs.existsSync(migrationsPath)) {

    await migrate(db, { migrationsFolder: migrationsPath })
  } else {
    console.log('No migrations folder found, skipping migrations')
  }
}
