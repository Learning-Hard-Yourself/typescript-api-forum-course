import { Application } from '@/bootstrap/Application'
import { createDatabase } from '@/config/database'
import 'dotenv-safe/config'

const port = Number(process.env.PORT ?? 3000)

// DB_PATH is a filesystem path (e.g. `database.db` or `/app/data/database.db`).
// We always pass a `file:` DSN to SQLite.
const dbPath = process.env.DB_PATH ?? 'database.db'
const databaseFile = dbPath.startsWith('file:') ? dbPath : `file:${dbPath}`

async function bootstrap(): Promise<void> {
  const { database } = createDatabase(databaseFile)

  const application = new Application({ database })
  const app = await application.create()

  const server = app.listen(port, () => {
    const address = server.address()
    if (address && typeof address !== 'string') {
      console.log(`🚀 Forum API listening on http://localhost:${address.port}`)
    } else {
      console.log(`🚀 Forum API listening on ${port}`)
    }
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error)
  process.exitCode = 1
})
