import type { BetterSQLiteDatabase } from 'drizzle-orm/better-sqlite3'

import type { schema } from '@/config/schema'

export type ForumDatabase = BetterSQLiteDatabase<typeof schema>
