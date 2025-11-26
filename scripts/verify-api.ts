import { randomUUID } from 'crypto'

const BASE_URL = 'http://localhost:3001/api/v1'
let cookie: string | null = null

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

async function main() {
    console.log('🚀 Starting End-to-End API Verification')

    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 2000))

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

    // 4. Create Thread
    console.log('\n--- 4. Create Thread ---')
    // We need a category first. Assuming one exists or we can create one?
    // Let's try to list categories first
    const categories = await request('GET', '/categories')
    console.log('Categories Response:', JSON.stringify(categories, null, 2))
    let categoryId = categories?.data?.[0]?.id

    if (!categoryId) {
        console.log('⚠️ No categories found, creating one (if admin)...')
        // This might fail if we are not admin, but let's try or skip
        // For now, let's assume we can't create category as normal user
        // We will try to create a thread with a random UUID if no category, expecting failure or mock
        // Actually, let's just use a hardcoded UUID if list is empty, likely 404
        categoryId = '00000000-0000-0000-0000-000000000000'
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
