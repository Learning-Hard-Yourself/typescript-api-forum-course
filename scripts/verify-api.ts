import Database from 'better-sqlite3'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import 'dotenv-safe/config'

const BASE_URL = 'http://localhost:3001/api/v1'
let cookie: string | null = null

async function runMigrations(): Promise<void> {
    console.log('\n🗄️  Running database migrations: npm run migrate')

    await new Promise<void>((resolve, reject) => {
        const child = spawn('npm', ['run', 'migrate'], {
            stdio: 'inherit',
            shell: process.platform === 'win32',
        })

        child.on('exit', (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`npm run migrate failed with exit code ${code ?? 0}`))
            }
        })
    })
}

async function request(method: string, endpoint: string, body?: any) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (cookie) {
        headers['Cookie'] = cookie
    }

    console.log(`\n🔹 ${method} ${endpoint}`)
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    // Capture cookie from login/register
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
        cookie = setCookie.split(';')[0]
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        console.log(`❌ Error ${response.status}:`, data)
        return null
    }

    console.log(`✅ Success ${response.status}`)
    return data
}

async function promoteUserToAdmin(userId: string): Promise<void> {
    const dbPath = process.env.DB_PATH ?? 'database.db'
    const databaseFile = dbPath.startsWith('file:') ? dbPath : `file:${dbPath}`

    console.log(`\n🛡️  Promoting user ${userId} to admin in ${databaseFile}`)

    const sqlite = new Database(databaseFile)
    try {
        const stmt = sqlite.prepare('UPDATE users SET role = ? WHERE id = ?')
        const result = stmt.run('admin', userId)
        if (result.changes === 0) {
            console.warn('⚠️ No user row updated when promoting to admin')
        } else {
            console.log('✅ User promoted to admin')
        }
    } catch (error) {
        console.error('❌ Failed to promote user to admin', error)
    } finally {
        sqlite.close()
    }
}

async function main() {
    console.log('🚀 Starting End-to-End API Verification')

    // 0. Run database migrations so the schema is up to date
    await runMigrations()

    // Wait for server to be ready
    await new Promise((r) => setTimeout(r, 2000))

    // 1. Register
    const username = `user_${randomUUID().substring(0, 8)}`
    const email = `${username}@example.com`
    const password = 'Password123!'

    console.log(`\n--- 1. Authentication (${username}) ---`)
    await request('POST', '/auth/register', {
        displayName: 'Test User',
        username,
        email,
        password
    })

    // 2. Login (Skipping to avoid rate limit, registration sets cookie)
    console.log('\n--- 2. Login (Skipped) ---')
    // await request('POST', '/auth/login', {
    //     email,
    //     password
    // })

    // 3. Get Profile
    console.log('\n--- 3. Get Current User ---')
    const user = await request('GET', '/auth/me')
    if (!user) throw new Error('Failed to get user')
    console.log('User ID:', user.data.user.id)

    // 3.1 Promote user to admin so we can create categories and manage threads
    await promoteUserToAdmin(user.data.user.id)

    // 4. Ensure Category & Create Thread
    console.log('\n--- 4. Create Thread ---')
    // First, try to list categories
    let categories = await request('GET', '/categories')
    console.log('Categories Response:', JSON.stringify(categories, null, 2))
    let categoryId = categories?.data?.[0]?.id

    // If none exist, create one as admin
    if (!categoryId) {
        console.log('⚠️ No categories found, creating one as admin...')
        const createdCategory = await request('POST', '/categories', {
            name: `General ${randomUUID().substring(0, 4)}`,
            description: 'Category created by verify-api script',
            slug: `general-${randomUUID().substring(0, 4)}`
        })

        categories = await request('GET', '/categories')
        console.log('Categories After Create:', JSON.stringify(categories, null, 2))
        categoryId = createdCategory?.data?.id ?? categories?.data?.[0]?.id
    }

    const thread = await request('POST', '/threads', {
        title: `Hello World Thread ${randomUUID().substring(0, 8)}`,
        content: 'This is a test thread created by the verification script.',
        categoryId
    })

    if (thread?.data) {
        const threadId = thread.data.id
        console.log('Thread ID:', threadId)

        // 5. Create Post
        console.log('\n--- 5. Create Post (Reply to Thread) ---')
        const post = await request('POST', '/posts', {
            threadId,
            content: 'This is a reply to the thread!'
        })

        if (post?.data) {
            const postId = post.data.id
            console.log('Post ID:', postId)

            // 6. Nested Reply
            console.log('\n--- 6. Nested Reply ---')
            await request('POST', `/posts/${postId}/reply`, {
                content: 'This is a nested reply!'
            })

            // 7. Vote
            console.log('\n--- 7. Vote on Post ---')
            await request('POST', `/posts/${postId}/vote`, {
                voteType: 'upvote'
            })
        }
    }

    // 8. Notifications
    console.log('\n--- 8. Check Notifications ---')
    await request('GET', '/notifications')

    // 9. Attachments (Sign URL)
    console.log('\n--- 9. Attachments (Sign URL) ---')
    await request('POST', '/attachments/sign', {
        filename: 'test.png',
        mimeType: 'image/png'
    })

    console.log('\n✨ Verification Complete!')
}

main().catch(console.error)
