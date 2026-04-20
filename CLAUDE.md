# CLAUDE.md

This file defines the architecture, conventions, and patterns of this project.
Read this before writing any code, creating any file, or suggesting any structure.

---

## Project Type

Monorepo with separate `backend/` and `frontend/` folders, each with their own `package.json`.
This file covers the **backend** only.

---

## Monorepo Structure

```
root/
├── backend/         → Node.js/Express API (scope of this document)
├── frontend/        → UI client (out of scope)
└── shared/          → shared code between backend and frontend
```

The root has its own `package.json` that declares the pnpm workspaces:

```json
{
  "name": "my-project",
  "private": true,
  "scripts": {
    "dev:backend": "pnpm --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev"
  },
  "pnpm": {
    "workspaces": ["backend", "frontend", "shared"]
  }
}
```

### shared/

Contains code used by both backend and frontend.

```
shared/
└── src/
    ├── abilities/   → CASL ability definitions
    ├── schemas/     → Zod schemas used on both sides
    └── types/       → shared TypeScript types
```

**What belongs in shared:**
- CASL abilities — the single source of truth for permission rules
- Zod schemas that validate both form input (frontend) and request body (backend)
- TypeScript types that cross the API boundary

**What does NOT belong in shared:**
- Database logic — Prisma stays in backend
- UI logic — components and hooks stay in frontend
- Express middleware — stays in backend

**Rule:** if only one side needs it, it stays in that side's package.

---

## Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Validation:** Zod
- **Test runner:** Vitest
- **HTTP testing:** Supertest

---

## Folder Structure

```
backend/
└── src/
    ├── app.ts                  → creates and configures the Express app, exports without listen
    ├── server.ts               → imports app, calls app.listen()
    ├── routes.ts               → aggregates all feature routers under /api
    ├── constants/
    │   └── errorCodes.ts       → ERROR_CODES map, ErrorCode object, getStatusCode()
    ├── middleware/
    │   ├── errorHandler.ts     → AppError class + global error handler
    │   ├── asyncHandler.ts     → wraps async controllers to forward errors to next()
    │   ├── authMiddleware.ts   → verifies Bearer JWT, injects req.userId
    │   └── rateLimiter.ts      → globalLimiter + endpoint-specific limiters
    ├── lib/
    │   └── prisma.ts           → single Prisma client instance
    ├── features/
    │   └── [feature]/
    │       ├── routes.ts       → defines routes, applies middlewares
    │       ├── controller.ts   → parses request, calls service, returns response
    │       ├── schema.ts       → Zod schemas + inferred types
    │       └── service.ts      → business logic, receives typed inputs
    └── test/
        ├── globalSetup.ts      → runs prisma migrate deploy before test suite
        └── setup.ts            → afterEach: deleteMany all tables / afterAll: disconnect
```

**Never** place business logic in controllers.
**Never** place HTTP knowledge (req, res) in services.
**Never** read the entire service file — trace from route → controller → service function.

---

## App vs Server separation

`app.ts` creates and configures the Express app and exports it **without calling listen**.
`server.ts` imports the app and calls `app.listen()`.

This separation is required for Supertest to import the app without starting the server.

```typescript
// app.ts
import express from 'express'
import { router } from './routes'
import { errorHandler } from './middleware/errorHandler'

export const app = express()

app.use(express.json())
app.use('/api', router)
app.use(errorHandler)
```

```typescript
// server.ts
import { app } from './app'

const PORT = process.env.PORT || 3333
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

---

## Feature Structure

Each feature follows this exact pattern:

```typescript
// routes.ts
import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware'
import { getResource, createResource } from './controller'

export const resourceRoutes = Router()

resourceRoutes.get('/', authMiddleware, getResource)
resourceRoutes.post('/', authMiddleware, createResource)
```

```typescript
// controller.ts
import { RequestHandler } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { createResourceSchema } from './schema'
import { createResource as createResourceService } from './service'

export const createResource: RequestHandler = asyncHandler(async (req, res) => {
  const body = createResourceSchema.parse(req.body)
  const result = await createResourceService(body)
  res.status(201).json(result)
})
```

```typescript
// schema.ts
import { z } from 'zod'

export const createResourceSchema = z.object({
  name: z.string().min(1),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>
```

```typescript
// service.ts
import { CreateResourceInput } from './schema'

export async function createResource(data: CreateResourceInput) {
  // business logic only — no req, no res, no HTTP knowledge
}
```

---

## Error Handling

### Error codes

All error codes live in `src/constants/errorCodes.ts`.
Each code carries its own HTTP status code — never pass statusCode directly to AppError.

```typescript
const ERROR_CODES = {
  // Generic
  INTERNAL_ERROR:   { statusCode: 500 },
  VALIDATION_ERROR: { statusCode: 400 },
  NOT_FOUND:        { statusCode: 404 },

  // Add domain-specific codes below
} as const

export type ErrorCodeKey = keyof typeof ERROR_CODES

export const ErrorCode = Object.fromEntries(
  Object.keys(ERROR_CODES).map(k => [k, k])
) as { [K in ErrorCodeKey]: K }

export function getStatusCode(code: ErrorCodeKey): number {
  return ERROR_CODES[code].statusCode
}
```

### AppError

```typescript
// middleware/errorHandler.ts
import { ErrorCodeKey, getStatusCode } from '../constants/errorCodes'

export class AppError extends Error {
  public statusCode: number

  constructor(public code: ErrorCodeKey) {
    super(code)
    this.name = 'AppError'
    this.statusCode = getStatusCode(code)
  }
}
```

### Throwing errors

Always throw via AppError with an ErrorCode:

```typescript
throw new AppError(ErrorCode.NOT_FOUND)
```

The global `errorHandler` returns `{ error: code }` for AppError and `{ error: 'INTERNAL_ERROR' }` for unknown errors. Never expose stack traces or internal messages.

---

## Authentication

Projects with login use JWT with access token + refresh token.

- **Access token** — short-lived, signed with `JWT_SECRET`
- **Refresh token** — long-lived, stored in database, rotated on each refresh, deleted on logout
- **Brute force protection** — track `failedLoginAttempts` and `lockedUntil` on the user model
- **Timing attack prevention** — always run bcrypt.compare even when user is not found (use a fake hash)
- **`authMiddleware`** — reads Bearer token, verifies with `JWT_SECRET`, injects `req.userId`

Protected routes use `authMiddleware` directly in `routes.ts`.

---

## Validation

Zod is the single source of truth for validation and types.
Parse in the controller, type in the service — never duplicate type definitions.

```typescript
// schema defines both validation and type
const schema = z.object({ ... })
type Input = z.infer<typeof schema> // ← use this everywhere, no separate interfaces
```

---

## Rate Limiting

Use `express-rate-limit`. Define limiters in `src/middleware/rateLimiter.ts`:

- `globalLimiter` — applied to all routes in `app.ts`
- Endpoint-specific limiters (e.g. `loginLimiter`) — applied directly in `routes.ts`

Rate limit responses use `{ code: ErrorCode.TOO_MANY_REQUESTS }`.

---

## Testing

### Setup

- Test database configured via `.env.test` with `DATABASE_TEST_URL`
- `globalSetup.ts` runs `prisma migrate deploy` before the test suite
- `setup.ts` cleans all tables with `deleteMany()` after each test and disconnects after all

### Test file locations

```
features/[feature]/
├── service.test.ts   → unit tests: calls service functions directly, asserts return values and thrown errors
└── routes.test.ts    → integration tests: calls HTTP endpoints via Supertest, asserts status codes and response shapes
```

### routes.test.ts pattern

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../app'

describe('POST /api/[feature]', () => {

  describe('comportamento', () => {
    it('dados válidos → 201', async () => {
      const res = await request(app)
        .post('/api/[feature]')
        .send({ ... })
      expect(res.status).toBe(201)
    })
  })

  describe('segurança', () => {
    it('sem token → 401', async () => {
      const res = await request(app)
        .post('/api/[feature]')
        .send({ ... })
      expect(res.status).toBe(401)
    })
  })

})
```

### service.test.ts pattern

```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from '../../lib/prisma'
import { createResource } from './service'
import { AppError } from '../../middleware/errorHandler'
import { ErrorCode } from '../../constants/errorCodes'

describe('createResource', () => {

  it('dados válidos → retorna recurso criado', async () => {
    const result = await createResource({ name: 'test' })
    expect(result.name).toBe('test')
  })

  it('nome ausente → lança VALIDATION_ERROR', async () => {
    await expect(createResource({ name: '' }))
      .rejects.toMatchObject({ code: ErrorCode.VALIDATION_ERROR })
  })

})
```

### Auth helper pattern

For protected endpoints, define a `loginAs()` helper at the top of the test file:

```typescript
async function loginAs(role?: string) {
  // create user + return valid access token
}
```

---

## Planning Documents

These files are auto-generated by skills and live at the project root.
Do not edit them manually.

| File | Generated by | Purpose |
|---|---|---|
| `SECURITY_TESTS.md` | `security-endpoint-plan` | Security threats and what to test per endpoint |
| `TEST_CASES.md` | `endpoint-test-cases` | Behavioral scenarios per endpoint |
| `SERVICE_CASES.md` | `service-analyzer` | Approved service function test scenarios |

---

## Utils

Reusable utilities live in `src/utils/`. Each file has a single responsibility and a
descriptive name (e.g. `convertDateToLocal.ts`, `formatCurrency.ts`).

Before writing any utility logic, read `UTILS.md` at the project root.
If a utility already exists for the task, use it — never rewrite existing utilities.
If you create a new utility, the `utils-mapper` skill will update `UTILS.md` automatically.

---

## Code Conventions

### Naming

- Variables and functions → `camelCase` in English
- Classes and types → `PascalCase` in English
- Global constants → `UPPER_SNAKE_CASE` in English

### TypeScript

TypeScript strictness is non-negotiable. Before writing any logic, types must be defined.
The type system is the first line of defense — never bypass it.

- **Never use `any`** — if the type is not inferred, declare it explicitly
- **Never cast with `as` to silence a type error** — fix the type instead
- **Never use `// @ts-ignore` or `// @ts-expect-error`** unless there is a documented reason
- **Always type function parameters and return values** when TypeScript cannot infer them
- **Derive types from Zod schemas** with `z.infer<typeof schema>` — never duplicate type definitions
- If TypeScript does not understand a value's type, annotate it — do not work around it

### ESLint

ESLint is present in every project and its rules must be respected.

- **Never disable ESLint rules** with `// eslint-disable`, `// eslint-disable-next-line`, or similar
- If a rule triggers, fix the code — do not silence the rule
- ESLint errors must be resolved before considering any task complete

---

## Task Workflow

Large features and audits are broken into tracked tasks inside the `tasks/` folder.
This folder is gitignored — files here are working documents, not project documentation.

### Rules

- Before starting any non-trivial task, create a file in `tasks/` based on `TEMPLATE.md`
- Work item by item — never advance without user confirmation
- After finishing each item, report what was done and wait for "can continue"
- The task file survives between sessions — resume from where the table shows as pending

### Confirmation flow

```
1. Finish one item
2. Report: what was done, what was found or created, any relevant detail
3. Wait for user confirmation
4. Only then move to the next item
```

This applies to every task type — implementation, audit, refactor, or investigation.

### File naming

```
tasks/
└── feat-{id}--{short-description}.md
```

Examples:
- `feat-7--security-audit-file-routes.md`
- `feat-12--create-client-module.md`
- `feat-15--refactor-auth-service.md`

---

## What NOT to Do

- Do not call `app.listen()` in `app.ts`
- Do not put business logic in controllers
- Do not put HTTP knowledge in services
- Do not pass statusCode directly to AppError — it lives in `errorCodes.ts`
- Do not duplicate types — derive everything from Zod schemas
- Do not expose stack traces or internal error messages to the client
- Do not read the entire service file — trace route → controller → service function
- Do not create separate `interface` or `type` definitions when a Zod schema already exists
- Do not use `any`, `as` casts, or `@ts-ignore` to bypass TypeScript
- Do not disable ESLint rules — fix the code instead
- Do not write utility logic without checking UTILS.md first
- Do not create a new utility if one already exists for the same purpose