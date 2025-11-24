import type { Express } from 'express'

import { Application } from '@/bootstrap/Application'
import { createDatabase } from '@/database/client'
import { runMigrations } from '@/database/migrator'
import { resetAuth } from '@/auth'
import type { ForumDatabase } from '@/database/types'

export interface TestApplicationContext {
  app: Express
  database: ForumDatabase
}

export const createTestApplication = async (): Promise<TestApplicationContext> => {
  const { sqlite, database } = createDatabase(':memory:')
  await runMigrations(sqlite)
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM accounts;
    DELETE FROM sessions;
    DELETE FROM verifications;
    DELETE FROM users;
    PRAGMA foreign_keys = ON;
  `)
  resetAuth()
  const application = new Application({ database })
  const app = await application.create()
  return { app, database }
}
