import 'dotenv-safe/config'
import { Application } from '@/bootstrap/Application'
import { createDatabase } from '@/config/database'

const port = Number(process.env.PORT ?? 3000)
const databaseFile = process.env.DB_FILE_NAME ?? 'file:database.db'

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
