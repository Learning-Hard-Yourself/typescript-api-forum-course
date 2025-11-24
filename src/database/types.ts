import type { BetterSQLiteDatabase } from 'drizzle-orm/better-sqlite3'

import type { schema } from '@/database/schema'

export type ForumDatabase = BetterSQLiteDatabase<typeof schema>
