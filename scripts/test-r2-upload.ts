import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

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

async function uploadFile(presignedUrl: string, fileBuffer: Buffer, mimeType: string): Promise<boolean> {
    console.log('\n🔹 Uploading file to R2...')

    const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': mimeType,
        },
        body: fileBuffer,
    })

    if (!response.ok) {
        console.log(`❌ Upload failed with status ${response.status}`)
        const text = await response.text()
        console.log('Error:', text)
        return false
    }

    console.log('✅ File uploaded successfully')
    return true
}

async function main() {
    console.log('🚀 Testing Cloudflare R2 File Upload\n')

    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 2000))

    // 1. Register a test user
    const username = `test_${randomUUID().substring(0, 8)}`
    const email = `${username}@example.com`
    const password = 'Password123!'

    console.log('--- 1. Register Test User ---')
    const registerResponse = await request('POST', '/auth/register', {
        displayName: 'R2 Test User',
        username,
        email,
        password
    })

    if (!registerResponse) {
        throw new Error('Failed to register user')
    }

    const userId = registerResponse.data.user.id
    console.log('User ID:', userId)

    // 2. Create a test thread (we need a post to attach files to)
    console.log('\n--- 2. Create Test Thread ---')
    const categories = await request('GET', '/categories')
    const categoryId = categories?.data?.[0]?.id

    if (!categoryId) {
        throw new Error('No categories found')
    }

    const thread = await request('POST', '/threads', {
        title: `R2 Test Thread ${randomUUID().substring(0, 8)}`,
        content: 'This thread is for testing R2 uploads',
        categoryId
    })

    if (!thread) {
        throw new Error('Failed to create thread')
    }

    const threadId = thread.data.id
    console.log('Thread ID:', threadId)

    // 3. Create a post to attach files to
    console.log('\n--- 3. Create Test Post ---')
    const post = await request('POST', '/posts', {
        threadId,
        content: 'Testing file attachments with R2'
    })

    if (!post) {
        throw new Error('Failed to create post')
    }

    const postId = post.data.id
    console.log('Post ID:', postId)

    // 4. Create a test file
    console.log('\n--- 4. Create Test File ---')
    const testContent = 'This is a test file for Cloudflare R2 upload. Created at: ' + new Date().toISOString()
    const testFilePath = join(process.cwd(), 'test-upload.txt')
    writeFileSync(testFilePath, testContent)
    console.log('✅ Test file created:', testFilePath)

    const fileBuffer = readFileSync(testFilePath)
    const filename = 'test-upload.txt'
    const mimeType = 'text/plain'
    const fileSize = fileBuffer.length

    // 5. Request presigned URL
    console.log('\n--- 5. Request Presigned URL ---')
    const signResponse = await request('POST', '/attachments/sign', {
        filename,
        mimeType
    })

    if (!signResponse) {
        throw new Error('Failed to get presigned URL')
    }

    console.log('Presigned URL received')
    console.log('Key:', signResponse.key)

    // 6. Upload file to R2
    console.log('\n--- 6. Upload File to R2 ---')
    const uploadSuccess = await uploadFile(signResponse.url, fileBuffer, mimeType)

    if (!uploadSuccess) {
        throw new Error('Failed to upload file to R2')
    }

    // 7. Register the attachment in the database
    console.log('\n--- 7. Register Attachment in Database ---')
    const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-31ab4cdab554497ba81080819bb47189.r2.dev'
    const attachmentUrl = `${publicUrl}/${signResponse.key}`

    const attachment = await request('POST', '/attachments', {
        postId,
        filename,
        mimeType,
        size: fileSize,
        url: attachmentUrl
    })

    if (!attachment) {
        throw new Error('Failed to register attachment')
    }

    console.log('✅ Attachment registered successfully')
    console.log('Attachment ID:', attachment.data.id)
    console.log('Public URL:', attachmentUrl)

    // 8. Verify the file is accessible
    console.log('\n--- 8. Verify File is Accessible ---')
    console.log('🔹 Checking public URL:', attachmentUrl)

    const verifyResponse = await fetch(attachmentUrl)
    if (verifyResponse.ok) {
        const content = await verifyResponse.text()
        console.log('✅ File is publicly accessible')
        console.log('Content preview:', content.substring(0, 50) + '...')
    } else {
        console.log(`⚠️ File might not be publicly accessible yet (status: ${verifyResponse.status})`)
        console.log('Note: R2 may take a few moments to make the file available via public URL')
    }

    console.log('\n✨ R2 Upload Test Complete!')
    console.log('\n📊 Summary:')
    console.log('- User created:', userId)
    console.log('- Thread created:', threadId)
    console.log('- Post created:', postId)
    console.log('- File uploaded to R2:', signResponse.key)
    console.log('- Attachment registered:', attachment.data.id)
    console.log('- Public URL:', attachmentUrl)
}

main().catch(console.error)
