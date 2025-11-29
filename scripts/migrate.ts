import Database from 'better-sqlite3'
import 'dotenv-safe/config'

import { runMigrations } from '@/config/migrator'

async function main(): Promise<void> {
    const dbPath = process.env.DB_PATH ?? 'database.db'
    const databaseFile = dbPath.startsWith('file:') ? dbPath : `file:${dbPath}`

    console.log(`\n🗄️  Running migrations on ${databaseFile}`)

    const sqlite = new Database(databaseFile)
    try {
        await runMigrations(sqlite)
        console.log('✅ Migrations completed successfully')
    } catch (error) {
        console.error('❌ Failed to run migrations', error)
        process.exitCode = 1
    } finally {
        sqlite.close()
    }
}

main().catch((error) => {
    console.error('❌ Unexpected error running migrations', error)
    process.exitCode = 1
})
