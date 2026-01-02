# Slack-Style Multi-Tenant Workspace Backend

## Overview

This project is a **Slack-inspired, multi-tenant backend system** designed to demonstrate real-world SaaS architecture, strict tenant isolation, and scalable backend design.

Each **workspace is a tenant**, fully isolated at the data and authorization layers, while sharing a single application and infrastructure. A single user can belong to multiple workspaces with different roles, mirroring production collaboration platforms.

**This project focuses on architecture, correctness, and scalability, not UI polish.**

---

## Key Architectural Goals

- ✅ Strong multi-tenant isolation
- ✅ Clear separation of identity vs membership
- ✅ Workspace-scoped RBAC
- ✅ Production-ready request flow
- ✅ Modular, extensible NestJS design

---

## Core Concepts

### Tenant Model

- **Tenant = Workspace**
- Workspace identified via subdomain (`acme.app.com`)
- Fallbacks: headers and JWT claims
- All data access is workspace-scoped

### Identity Model

- **User** = global identity
- **WorkspaceMember** = workspace-scoped role & permissions
- Users can belong to multiple workspaces simultaneously

---

## High-Level Architecture

Client (Web / Mobile)
   |
Load Balancer / API Gateway
   |
Workspace Resolver (Tenant Middleware)
   |
Authentication (JWT)
   |
Authorization (Workspace RBAC)
   |
Business Logic (Channels / Messages / Members)
   |
Tenant-Scoped Database Access
   |
Usage Tracking & Feature Flags
   |
Response

---

## Technology Stack

| Layer               | Technology       |
|---------------------|------------------|
| Backend Framework   | NestJS           |
| Database            | PostgreSQL       |
| ORM                 | TypeORM          |
| Cache / Counters    | Redis            |
| Background Jobs     | BullMQ           |
| File Storage        | MinIO            |
| Auth                | Passport.js + JWT|
| API Docs            | Swagger          |

---

## Database Strategy

### Schema-Per-Tenant (Workspace)

- Single PostgreSQL database
- One schema per workspace:

```sql
workspace_acme.channels
workspace_acme.messages
workspace_acme.members
```

### Why this approach

- ✅ Strong isolation
- ✅ Easy auditing
- ✅ Shared connection pool
- ✅ Scales well to thousands of tenants

---

## Core Modules

src/
├── core/
│   ├── tenant/          # Workspace resolution
│   ├── auth/            # JWT authentication
│   ├── rbac/            # Workspace roles & permissions
│   ├── feature-flags/   # Plan-based access
│   └── usage/           # Metrics & limits
│
├── workspaces/
├── members/
├── channels/
├── messages/
├── files/
└── notifications/

---

## Authorization Model (RBAC)

Roles are **workspace-scoped**, not global:

- **Owner**
- **Admin**
- **Member**
- **Guest**

### Examples

- Only Admins can create channels
- Only channel members can post messages
- Guests have read-only access

## Request Flow (Example)

**POST `/channels/:id/messages`**

1. Resolve workspace from subdomain
2. Validate JWT
3. Verify workspace membership
4. Verify channel membership
5. Persist message in tenant schema
6. Emit notification event
7. Track usage metrics
8. Return response

**This flow is consistent across all endpoints.**

---

## Feature Flags & Plans

Workspace plans control:

- Message history limits
- File storage limits
- Advanced features (audit logs, integrations)

**Feature checks occur before business logic execution.**

---

## Usage Tracking

Tracked per workspace:

- API calls
- Message count
- File storage
- Active members

**Used for:**

- Billing
- Rate limiting
- Capacity planning

---

## What This Project Demonstrates

- ✅ Real multi-tenant SaaS design (not demo CRUD)
- ✅ Correct isolation boundaries
- ✅ Clean authorization modeling
- ✅ Production-grade NestJS structure
- ✅ Trade-off awareness (schema-per-tenant vs database-per-tenant)

---

## Future Enhancements

- [ ] WebSocket gateway for real-time messaging
- [ ] Audit log service
- [ ] Search service (OpenSearch)
- [ ] Cross-workspace notifications
- [ ] Tenant migration tooling

---

### Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=slack_multi_tenant

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## API Documentation

Once running, access Swagger documentation at:

```http://localhost:3000/api/docs```

## Authentication Flow

### 1. User Registration

POST /auth/register
{
  "email": ```"john@example.com"```,
  "password": "SecurePass123!",
  "fullName": "John Doe"
}

Response:
{
  "user": { "id": "...", "email": "..." },
  "token": "eyJhbGc..."
}

### 2. Workspace Creation

POST /workspaces
Headers: Authorization: Bearer ```<token>```
{
  "slug": "acme",
  "name": "Acme Corporation"
}

Response:
{
  "workspace": {
    "id": "...",
    "slug": "acme",
    "name": "Acme Corporation"
  }
}

### 3. Workspace Access

GET /channels
Headers:
  Authorization: Bearer ```<token>```
  X-Workspace-ID: acme

OR

Subdomain: acme.app.com

---

## RBAC Examples

### Channel Creation (Admin Only)

```typescript
@Post()
@RequireRole('admin', 'owner')
async createChannel(
  @Workspace() workspace: WorkspaceEntity,
  @CurrentUser() user: UserEntity,
  @Body() dto: CreateChannelDto
) {
  return this.channelsService.create(workspace.id, dto);
}
```

### Message Posting (Channel Members Only)

```typescript
@Post(':channelId/messages')
@RequireChannelMembership()
async postMessage(
  @Param('channelId') channelId: string,
  @Workspace() workspace: WorkspaceEntity,
  @CurrentUser() user: UserEntity,
  @Body() dto: CreateMessageDto
) {
  return this.messagesService.create(workspace.id, channelId, user.id, dto);
}
```

## Contact

For questions or feedback, please open an issue or reach out at:

- GitHub: [@carissaayo](https://github.com/carissaayo)
- Email: <ajaoyussufayo@gmail.com>

---
