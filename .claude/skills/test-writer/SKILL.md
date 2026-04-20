---
name: test-writer
description: >
  Writes integration test files (routes.test.ts) for REST API endpoints using Supertest
  and Vitest. Use this skill whenever an endpoint is created or modified and test code
  needs to be generated or updated. Trigger after endpoint-test-cases and
  security-endpoint-plan have already produced their documents, or when the user explicitly
  asks to write tests for an endpoint. Reads TEST_CASES.md, SECURITY_TESTS.md, and the
  feature source files (routes.ts, controller.ts, service.ts) to produce the test file.
---

# Test Writer

Writes `routes.test.ts` inside the feature folder, covering both behavioral scenarios
(from `TEST_CASES.md`) and security scenarios (from `SECURITY_TESTS.md`).

The test hits the actual HTTP layer using Supertest. No mocks on the database —
uses the project's existing test database configuration.

---

## Step 1 — Detect the stack

Before writing any code, read the project's `package.json` (backend) and identify:

| What to look for | How to use it |
|---|---|
| `vitest` present | Use Vitest as test runner |
| `jest` present | Use Jest as test runner |
| Neither present | Install Vitest: `npm install -D vitest` |
| `supertest` present | Use Supertest for HTTP calls |
| Neither present | Install Supertest: `npm install -D supertest @types/supertest` |
| Test database config | Look for `DATABASE_TEST_URL` or equivalent in `.env.test` or `env.example` |

Never assume — always read `package.json` first.

---

## Step 2 — Read the source files

Read only the files inside the target feature folder:

1. `routes.ts` — extract: HTTP method, path, middleware chain (auth, validation, etc.)
2. `controller.ts` — extract: what it calls, what it returns, error codes it handles
3. `service.ts` — extract: error codes thrown (e.g. `USER_NOT_FOUND`, `INVALID_AMOUNT`)

This gives the shape of requests, responses, and the exact error codes to assert.

---

## Step 3 — Read the planning documents

Read from the project root:

- `TEST_CASES.md` — find the entry for this endpoint → behavioral scenarios + expected status codes
- `SECURITY_TESTS.md` — find the entry for this endpoint → security scenarios + expected behavior

If either file is missing or has no entry for this endpoint, proceed with what is available
and note the gap in a comment at the top of the test file.

---

## Step 4 — Write the test file

### File location

```
backend/src/features/[feature-name]/routes.test.ts
```

### File structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest' // or jest globals
import request from 'supertest'
import { app } from '../../app' // adjust import to match project structure

// ─── Helpers ────────────────────────────────────────────────────────────────

// seed helpers go here — keep them minimal and scoped to this test file

// ─── [METHOD] /path/to/endpoint ─────────────────────────────────────────────

describe('[METHOD] /path/to/endpoint', () => {

  // --- Behavioral scenarios (from TEST_CASES.md) ---

  describe('comportamento', () => {
    it('[cenário do TEST_CASES.md]', async () => { ... })
  })

  // --- Security scenarios (from SECURITY_TESTS.md) ---

  describe('segurança', () => {
    it('[cenário do SECURITY_TESTS.md]', async () => { ... })
  })

})
```

### Writing rules

**One `it` per scenario row** — each row in `TEST_CASES.md` and each threat in
`SECURITY_TESTS.md` becomes exactly one `it` block.

**Test description mirrors the scenario** — use the same language from the planning
documents so the test output is self-explanatory without reading the code.

**Assert what matters, nothing else:**
- Status code — always
- Response body shape — only for happy path and when the shape is explicitly described
- Error code — when the service throws a known code (e.g. `{ code: 'USER_NOT_FOUND' }`)
- Absence of sensitive fields — for security scenarios that require it

**Seed only what the test needs** — create the minimum database state required.
Clean up after each test that writes to the database.

**Auth helper pattern** — if the endpoint requires authentication, create a
`loginAs(role)` helper at the top of the file that returns a valid token.
Do not repeat the login logic inside each `it`.

**Never mock the database** — use the test database. If the connection string is not
found, throw a clear error at the top of the file pointing to where to configure it.

---

## Step 5 — Handle the `app` import

The test needs to import the Express/Fastify app instance. Look for it in:
- `src/app.ts`
- `src/server.ts`
- `src/index.ts`

If the app starts listening inside the same file it's defined (e.g. `app.listen()`),
the project needs the app exported separately from the listen call. If this is not the
case, note it as a comment at the top of the test file and ask the user to confirm
the correct import path before running the tests.

---

## Step 6 — Output

Place the generated file at:

```
backend/src/features/[feature-name]/routes.test.ts
```

If the file already exists, update only the `describe` block for the affected endpoint.
Do not overwrite unrelated test blocks.

---

## What NOT to Do

- Do not mock the database layer.
- Do not test business logic — that belongs in `service.test.ts`.
- Do not write more assertions than necessary per scenario.
- Do not invent scenarios beyond what `TEST_CASES.md` and `SECURITY_TESTS.md` define.
- Do not hardcode credentials, tokens, or database URLs.
- Do not add test scenarios for endpoints not in scope.
