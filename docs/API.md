# API Reference

Complete API documentation for AccountSafe.

Base URL: `/api/`

---

## Table of Contents

- [Authentication](#authentication)
- [Vault Operations](#vault-operations)
- [Security Controls](#security-controls)
- [Shared Secrets](#shared-secrets)
- [User Management](#user-management)

---

## Authentication

AccountSafe uses zero-knowledge authentication. The client derives an authentication hash from the master password and transmits only the hash, never the password itself.

### Register

Create a new user account.

```
POST /api/zk/register/
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Unique username |
| `email` | string | Email address |
| `auth_hash` | string | PBKDF2-derived authentication hash |
| `salt` | string | Base64-encoded salt for key derivation |
| `turnstile_token` | string | Cloudflare Turnstile token (if enabled) |

**Response:** `201 Created`

```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com"
}
```

### Login

Authenticate and receive JWT tokens.

```
POST /api/zk/login/
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Username |
| `auth_hash` | string | PBKDF2-derived authentication hash |
| `turnstile_token` | string | Cloudflare Turnstile token (if enabled) |

**Response:** `200 OK`

```json
{
  "key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "salt": "base64-encoded-salt",
  "is_duress": false
}
```

### Logout

Invalidate the current session.

```
POST /api/zk/logout/
Authorization: Token <jwt>
```

**Response:** `200 OK`

### Refresh Token

Obtain a new access token using refresh token.

```
POST /api/token/refresh/
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `refresh` | string | Refresh token |

**Response:** `200 OK`

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## Vault Operations

All vault data is encrypted client-side before transmission. The server stores and returns encrypted blobs without the ability to decrypt them.

### Categories

Organizational containers for credentials.

#### List Categories

```
GET /api/categories/
Authorization: Token <jwt>
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Social Media",
    "icon": "users",
    "order": 0
  }
]
```

#### Create Category

```
POST /api/categories/
Authorization: Token <jwt>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Category name |
| `icon` | string | Icon identifier (optional) |

**Response:** `201 Created`

#### Update Category

```
PUT /api/categories/{id}/
Authorization: Token <jwt>
```

#### Delete Category

```
DELETE /api/categories/{id}/
Authorization: Token <jwt>
```

**Response:** `204 No Content`

### Organizations

Service/platform groupings within categories.

#### List Organizations

```
GET /api/organizations/
Authorization: Token <jwt>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | integer | Filter by category ID |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "GitHub",
    "logo_url": "https://...",
    "website_link": "https://github.com",
    "category": 1
  }
]
```

#### Create Organization

```
POST /api/organizations/
Authorization: Token <jwt>
```

#### Update/Delete Organization

```
PUT /api/organizations/{id}/
DELETE /api/organizations/{id}/
Authorization: Token <jwt>
```

### Profiles (Credentials)

Encrypted credential storage.

#### List Profiles

```
GET /api/profiles/
Authorization: Token <jwt>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organization` | integer | Filter by organization ID |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Personal Account",
    "organization": 1,
    "username_encrypted": "base64...",
    "username_iv": "base64...",
    "password_encrypted": "base64...",
    "password_iv": "base64...",
    "email_encrypted": "base64...",
    "email_iv": "base64...",
    "notes_encrypted": "base64...",
    "notes_iv": "base64...",
    "is_pinned": false,
    "is_breached": false,
    "password_strength": 4,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Profile

```
POST /api/profiles/
Authorization: Token <jwt>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name |
| `organization` | integer | Organization ID |
| `username_encrypted` | string | AES-GCM encrypted username |
| `username_iv` | string | Initialization vector |
| `password_encrypted` | string | AES-GCM encrypted password |
| `password_iv` | string | Initialization vector |
| `email_encrypted` | string | AES-GCM encrypted email (optional) |
| `email_iv` | string | Initialization vector |
| `notes_encrypted` | string | AES-GCM encrypted notes (optional) |
| `notes_iv` | string | Initialization vector |

**Response:** `201 Created`

#### Update Profile

```
PUT /api/profiles/{id}/
Authorization: Token <jwt>
```

#### Delete Profile

```
DELETE /api/profiles/{id}/
Authorization: Token <jwt>
```

**Response:** `204 No Content`

#### Toggle Pin

```
POST /api/profiles/{id}/toggle-pin/
Authorization: Token <jwt>
```

---

## Security Controls

### Security PIN

Secondary authentication for sensitive operations.

#### Set PIN

```
POST /api/pin/set/
Authorization: Token <jwt>
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `pin` | string | 4-6 digit PIN |

**Response:** `200 OK`

#### Verify PIN

```
POST /api/pin/verify/
Authorization: Token <jwt>
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `pin` | string | PIN to verify |

**Response:** `200 OK`

```json
{
  "verified": true
}
```

### Session Management

#### List Active Sessions

```
GET /api/sessions/
Authorization: Token <jwt>
```

**Response:** `200 OK`

```json
[
  {
    "id": "abc123",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "location": "New York, US",
    "created_at": "2025-01-01T00:00:00Z",
    "is_current": true
  }
]
```

#### Revoke Session

```
POST /api/sessions/{id}/revoke/
Authorization: Token <jwt>
```

**Response:** `200 OK`

### Panic Mode

Switch to duress vault using alternate authentication.

```
POST /api/zk/switch-mode/
Authorization: Token <jwt>
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `auth_hash` | string | Duress authentication hash |

---

## Shared Secrets

Time-limited secret sharing.

### Create Shared Secret

```
POST /api/shared-secrets/
Authorization: Token <jwt>
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `content_encrypted` | string | Encrypted content |
| `content_iv` | string | Initialization vector |
| `expires_in` | integer | Expiration in hours |
| `passphrase_hash` | string | Optional passphrase protection |

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "url": "https://domain.com/share/uuid",
  "expires_at": "2025-01-02T00:00:00Z"
}
```

### Retrieve Shared Secret

```
GET /api/shared-secrets/{id}/
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `passphrase` | string | Passphrase if protected |

**Response:** `200 OK`

```json
{
  "content_encrypted": "base64...",
  "content_iv": "base64..."
}
```

---

## User Management

### Get Current User

```
GET /api/user/
Authorization: Token <jwt>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com"
}
```

### Dashboard Statistics

```
GET /api/dashboard/statistics/
Authorization: Token <jwt>
```

**Response:** `200 OK`

```json
{
  "total_credentials": 42,
  "total_categories": 5,
  "total_organizations": 12,
  "breached_count": 1,
  "weak_passwords": 3,
  "health_score": 85
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "detail": "Additional details (optional)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource does not exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
