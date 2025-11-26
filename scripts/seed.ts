import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { v7 as uuidv7 } from 'uuid'
import { categories } from '../src/config/schema'

const sqlite = new Database('database.db')
const db = drizzle(sqlite)

async function seed() {
    console.log('🌱 Seeding database...')

    try {
        await db.insert(categories).values({
            id: uuidv7(),
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'Talk about anything here',
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
        console.log('✅ Created "General Discussion" category')
    } catch (e) {
        console.log('⚠️ Category might already exist:', e.message)
    }
}

seed()
