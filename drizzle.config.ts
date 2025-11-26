import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/config/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'database.db',
    },
})
