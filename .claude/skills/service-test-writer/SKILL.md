---
name: service-test-writer
description: >
  Writes service.test.ts for a specific service function using the approved SERVICE_CASES.md.
  Use this skill after service-analyzer has produced and the developer has validated
  SERVICE_CASES.md. Reads SERVICE_CASES.md and the target service function to write
  unit tests that call service functions directly — no HTTP, no Supertest.
  Trigger when the user asks to write service tests for a specific endpoint or function.
---

# Service Test Writer

Writes `service.test.ts` inside the feature folder, covering all scenarios approved
in `SERVICE_CASES.md`. Tests call service functions directly — no HTTP layer involved.

---

## Step 1 — Read the planning document

Read `SERVICE_CASES.md` at the project root.
Find the entry for the target feature and function.
If the entry does not exist, stop and instruct the developer to run `service-analyzer` first.

---

## Step 2 — Trace the service function

Follow the chain to read only what is needed:

1. Read `routes.ts` — identify which controller handles the target endpoint
2. Read `controller.ts` — identify which service function is called
3. Read `service.ts` — read **only** that function

Extract:
- Exact function signature (name, parameters, return type)
- Error codes thrown (to write precise `.rejects.toMatchObject` assertions)
- Whether parameters reference database models (signals seed requirement)

---

## Step 3 — Identify seed requirements

For each scenario in `SERVICE_CASES.md`, identify what database state is needed
before the function can be called.

If any scenario requires pre-existing database records, ask the developer:

```
Para testar `[functionName]` preciso criar os seguintes dados no banco antes de cada cenário:

- [model A] com [relevant fields]
- [model B] referenciando [model A]

Como você cria esses registros no seu projeto?
(ex: via prisma.[model].create() diretamente, via um helper existente, etc.)
```

Wait for the response before writing any code.
If no database state is needed (pure logic functions), skip this step.

---

## Step 4 — Write the test file

### File location

```
backend/src/features/[feature-name]/service.test.ts
```

### File structure

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '../../lib/prisma'
import { [functionName] } from './service'
import { AppError } from '../../middleware/errorHandler'
import { ErrorCode } from '../../constants/errorCodes'

// ─── Helpers ────────────────────────────────────────────────────────────────

// seed helpers based on developer's confirmed approach

// ─── [functionName] ─────────────────────────────────────────────────────────

describe('[functionName]', () => {
  it('[cenário em português] → [resultado esperado]', async () => { ... })
})
```

### Writing rules

**One `it` per scenario row** in `SERVICE_CASES.md` — never merge or skip scenarios.

**Test description mirrors the scenario** — use Portuguese, follow the `→` separator pattern:
```typescript
it('currentValue > balance → retorna yield positivo', async () => { ... })
it('box inexistente → lança BOX_NOT_FOUND', async () => { ... })
```

**Assertions:**
- Successful return → assert the exact fields described in SERVICE_CASES.md
- Thrown error → always use `.rejects.toMatchObject({ code: ErrorCode.[CODE] })`
- Never assert fields not mentioned in SERVICE_CASES.md

**Seed helpers** — write based on developer's confirmed approach from Step 3.
Keep helpers minimal — create only what the test needs.

**No mocks** — use the test database directly via Prisma.
Cleanup is handled globally by `test/setup.ts` — do not add `afterEach` inside the test file.

**No HTTP** — never import `app`, `request`, or `supertest` in this file.

---

## Step 5 — Handle existing file

If `service.test.ts` already exists:
- Add the new `describe` block for the target function
- Do not overwrite or modify existing `describe` blocks
- Keep the existing imports, add only what is new

---

## What NOT to Do

- Do not write tests before SERVICE_CASES.md exists and is validated
- Do not write seeds without confirming the approach with the developer
- Do not mock the database
- Do not import or use HTTP/Supertest — this is a unit test file
- Do not add `afterEach` or cleanup logic — it is handled globally
- Do not assert fields not described in SERVICE_CASES.md
- Do not merge multiple scenarios into one `it` block
