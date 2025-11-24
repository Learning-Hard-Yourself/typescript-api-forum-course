import 'dotenv-safe/config'

import type { AddressInfo } from 'node:net'

import { Application } from '@/bootstrap/Application'
import { createDatabase } from '@/database/client'
import { runMigrations } from '@/database/migrator'

const port = Number(process.env.PORT ?? 3000)
const databaseFile = process.env.DB_FILE_NAME ?? 'file:database.db'

async function bootstrap(): Promise<void> {
  const { sqlite, database } = createDatabase(databaseFile)
  await runMigrations(sqlite)

  const application = new Application({ database })
  const app = await application.create()

  const server = app.listen(port, () => {
    const address = server.address() as AddressInfo
     
    console.log(`🚀 Forum API listening on http://localhost:${address.port}`)
  })
}

bootstrap().catch((error) => {
   
  console.error('Failed to start server', error)
  process.exitCode = 1
})
