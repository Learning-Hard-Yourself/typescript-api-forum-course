# Forum API Documentation

## Overview

This is a RESTful API for a forum application built with TypeScript, Express, and Better Auth.

### Base URL
`http://localhost:3000/api/v1`

### Authentication
The API uses session-based authentication via `better-auth`.
- **Session Cookie**: `better-auth.session_token`
- **CSRF Protection**: Standard browser protections apply.

### Rate Limiting
The API implements rate limiting to prevent abuse:
- **Auth Endpoints**: 5 requests per 15 minutes
- **Thread Creation**: 5 threads per hour
- **Post Creation**: 10 posts per hour
- **Reply Creation**: 20 replies per hour
- **General API**: 100 requests per 15 minutes

---

## Endpoints

### 🔐 Authentication

#### Register
Create a new user account.

**Request:**
```http
POST /api/v1/auth/register HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "username": "johndoe"
}
```

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json
Set-Cookie: better-auth.session_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax

{
  "data": {
    "user": {
      "id": "019ac02c-1234-7890-abcd-ef1234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "avatarUrl": null,
      "role": "user"
    }
  }
}
```

#### Login
Sign in to an existing account.

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: better-auth.session_token=eyJhbGc...; Path=/; HttpOnly; SameSite=Lax

{
  "data": {
    "user": {
      "id": "019ac02c-1234-7890-abcd-ef1234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "user"
    }
  }
}
```

#### Get Current User
Get the currently authenticated user's profile.

**Request:**
```http
GET /api/v1/auth/me HTTP/1.1
Host: localhost:3001
Cookie: better-auth.session_token=eyJhbGc...
```

**Response (200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "user": {
      "id": "019ac02c-1234-7890-abcd-ef1234567890",
      "username": "johndoe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "avatarUrl": null,
      "role": "user"
    }
  }
}
```

#### Logout
Sign out and invalidate the session.
- **URL**: `/auth/logout`
- **Method**: `POST`

---

### 👤 Users

#### Get User Profile
- **URL**: `/users/:id`
- **Method**: `GET`

#### Update User Profile
- **URL**: `/users/:id`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "name": "New Name",
    "bio": "Updated bio"
  }
  ```

#### Get User Stats
Get statistics for a user (thread count, post count, reputation).
- **URL**: `/users/:id/stats`
- **Method**: `GET`

---

### 🧵 Threads

#### List Threads
Get a paginated list of threads.
- **URL**: `/threads`
- **Method**: `GET`
- **Query Params**:
  - `page`: Page number (default: 1)
  - `perPage`: Items per page (default: 10)
  - `categoryId`: Filter by category
  - `sortBy`: `newest` | `popular`

#### Create Thread
**Request:**
```http
POST /api/v1/threads HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Cookie: better-auth.session_token=eyJhbGc...

{
  "title": "Discussion Topic",
  "content": "Thread content...",
  "categoryId": "019ac01f-4494-71d9-acc0-70ce1bfcae83"
}
```

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "019ac028-0167-725a-b0d8-c67058e5cf65",
    "categoryId": "019ac01f-4494-71d9-acc0-70ce1bfcae83",
    "authorId": "019ac028-012f-731a-bb39-65a77c457c94",
    "title": "Discussion Topic",
    "slug": "discussion-topic",
    "isPinned": false,
    "isLocked": false,
    "viewCount": 0,
    "replyCount": 0,
    "createdAt": "2025-11-26T12:30:00.000Z",
    "updatedAt": "2025-11-26T12:30:00.000Z"
  }
}
```

#### Get Thread Details
- **URL**: `/threads/:id`
- **Method**: `GET`

#### Pin Thread (Mod/Admin)
- **URL**: `/threads/:id/pin`
- **Method**: `POST`

#### Lock Thread (Mod/Admin)
- **URL**: `/threads/:id/lock`
- **Method**: `POST`

---

### 💬 Posts

#### Get Thread Posts
Get all posts for a thread, including nested replies.
- **URL**: `/threads/:threadId/posts`
- **Method**: `GET`

#### Create Post (Reply to Thread)
**Request:**
```http
POST /api/v1/posts HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Cookie: better-auth.session_token=eyJhbGc...

{
  "threadId": "019ac028-0167-725a-b0d8-c67058e5cf65",
  "content": "This is a reply to the thread."
}
```

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "019ac028-0179-7528-affc-d8c97dcbb07e",
    "threadId": "019ac028-0167-725a-b0d8-c67058e5cf65",
    "authorId": "019ac028-012f-731a-bb39-65a77c457c94",
    "content": "This is a reply to the thread.",
    "voteScore": 0,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2025-11-26T12:32:00.000Z",
    "updatedAt": "2025-11-26T12:32:00.000Z"
  }
}
```

#### Reply to Post (Nested)
**Request:**
```http
POST /api/v1/posts/019ac028-0179-7528-affc-d8c97dcbb07e/reply HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Cookie: better-auth.session_token=eyJhbGc...

{
  "content": "This is a nested reply."
}
```

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "019ac028-1a0a-706c-a6f6-65fd3673da0c",
    "threadId": "019ac028-0167-725a-b0d8-c67058e5cf65",
    "parentPostId": "019ac028-0179-7528-affc-d8c97dcbb07e",
    "authorId": "019ac028-012f-731a-bb39-65a77c457c94",
    "content": "This is a nested reply.",
    "voteScore": 0,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2025-11-26T12:33:00.000Z",
    "updatedAt": "2025-11-26T12:33:00.000Z"
  }
}
```

#### Vote on Post
**Request:**
```http
POST /api/v1/posts/019ac028-0179-7528-affc-d8c97dcbb07e/vote HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Cookie: better-auth.session_token=eyJhbGc...

{
  "voteType": "upvote"
}
```

**Response (200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "vote": {
    "id": "019ac029-abcd-7890-1234-567890abcdef",
    "postId": "019ac028-0179-7528-affc-d8c97dcbb07e",
    "userId": "019ac028-012f-731a-bb39-65a77c457c94",
    "voteType": "upvote",
    "createdAt": "2025-11-26T12:35:00.000Z"
  },
  "postScore": 1
}
```

**Note:** Use `"downvote"` to downvote. Voting again with the same type updates the existing vote.

### 📎 Attachments

#### Sign Upload URL
Generate a presigned URL for uploading files directly to storage (e.g., R2/S3).

**Request:**
```http
POST /api/v1/attachments/sign HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Cookie: better-auth.session_token=eyJhbGc...

{
  "filename": "image.png",
  "mimeType": "image/png"
}
```

**Response (200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "url": "https://bucket.r2.cloudflarestorage.com/uploads/abc123.png?X-Amz-Algorithm=...",
  "key": "uploads/abc123.png"
}
```

**Note:** The presigned URL is valid for 1 hour. Upload the file directly to this URL using a PUT request.

#### Create Attachment
Record a successfully uploaded file in the database.
- **URL**: `/attachments`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "postId": "uuid-string",
    "filename": "image.png",
    "mimeType": "image/png",
    "size": 1024,
    "url": "https://public-url.com/image.png"
  }
  ```

---

### 🔔 Notifications

#### List Notifications
- **URL**: `/notifications`
- **Method**: `GET`

#### Mark as Read
- **URL**: `/notifications/:id/read`
- **Method**: `POST`

---

## Error Handling

The API returns standard HTTP status codes with JSON error responses:

### Common Error Responses

#### 400 Bad Request (Validation Error)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "message": "Unauthorized"
}
```

#### 403 Forbidden
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Resource not found"
}
```

#### 429 Too Many Requests
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 900

{
  "message": "Too many authentication attempts, please try again later",
  "retryAfter": 900
}
```

#### 500 Internal Server Error
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "message": "Internal Server Error"
}
```

### Status Code Summary
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion/logout)
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized (Not logged in)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (Rate limit exceeded)
- `500`: Internal Server Error
