# Prisma v7 Reference

Fetched from official docs on 2026-04-20.

---

## Breaking Changes vs v5/v6

### Node.js & TypeScript minimum
- Node: 20.19.0 minimum (22.x recommended)
- TypeScript: 5.4.0 minimum (5.9.x recommended)

### ESM Required
Must set `"type": "module"` in `package.json` and configure TypeScript:
```json
"module": "ESNext",
"moduleResolution": "bundler"
```

### Schema generator changed
`prisma-client-js` is deprecated. Use `prisma-client` with explicit `output`:
```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma/client"
}
```

### datasource block no longer accepts `url`
The `url` field was removed from `schema.prisma`. The datasource block now only declares the provider:
```prisma
datasource db {
  provider = "postgresql"
}
```
Connection URL moves entirely to `prisma.config.ts` via `datasource.url`.
Using `url` in the schema will throw: *"The datasource property `url` is no longer supported in schema files."*

### Import path changed
```typescript
// Before (v5/v6)
import { PrismaClient } from "@prisma/client"

// After (v7) — path depends on `output` in schema generator
// npx prisma init generates: output = "../src/generated/prisma"
import { PrismaClient } from '../generated/prisma'
```

### Driver adapters mandatory
All databases now require an explicit driver adapter.

Install for PostgreSQL:
```bash
pnpm add @prisma/adapter-pg pg
pnpm add -D @types/pg
```

### PrismaClient instantiation
`adapter` is required (unless using Prisma Accelerate).
Import path from `npx prisma init` output: `../generated/prisma/client`

```typescript
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

### prisma.config.ts required
- Place at `backend/` root alongside `package.json`
- Prisma CLI runs this file with its own TypeScript executor — NOT covered by the project tsconfig
- Do NOT add it to `tsconfig.json` include (causes rootDir conflict)
- Editor type errors in this file are false positives — they don't affect execution
- Requires `dotenv` installed as devDependency: `pnpm add -D dotenv`

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### .env NOT auto-loaded
Must install dotenv (`pnpm add -D dotenv`) and import `dotenv/config` at the top of `prisma.config.ts`.

### CLI changes
- Removed `--skip-generate` and `--skip-seed` flags
- Removed `--schema` and `--url` from `prisma db execute`
- `prisma migrate diff` uses `--from-config-datasource` instead of deprecated flags
- Seed: use `npx prisma db seed` explicitly (no longer runs automatically with migrations)

### Removed
- Client middleware API → replaced by Client Extensions
- Metrics preview feature
- 12 Prisma-specific environment variables
- MongoDB support (use v6 for MongoDB)

---

## Setup Steps (PostgreSQL)

1. Install packages:
```bash
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add -D prisma @types/pg
```

2. Create `prisma/schema.prisma` with new generator syntax
3. Create `prisma.config.ts` at project root
4. Run `npx prisma generate`
5. Import from generated path in `src/lib/prisma.ts`

---

## CRUD Reference

### Create
```typescript
// single
await prisma.user.create({ data: { email: 'a@b.com', name: 'Alice' } })

// many
await prisma.user.createMany({
  data: [{ email: 'a@b.com' }, { email: 'b@b.com' }],
  skipDuplicates: true,
})

// many and return
await prisma.user.createManyAndReturn({ data: [...] })
```

### Read
```typescript
// by unique field
await prisma.user.findUnique({ where: { email: 'a@b.com' } })

// all
await prisma.user.findMany()

// filtered
await prisma.user.findMany({ where: { email: { endsWith: 'prisma.io' } } })

// select fields
await prisma.user.findUnique({
  where: { email: 'a@b.com' },
  select: { email: true, name: true },
})

// include relations
await prisma.user.findMany({ include: { posts: true } })
```

### Update
```typescript
// single
await prisma.user.update({ where: { email: 'a@b.com' }, data: { name: 'New' } })

// many
await prisma.user.updateMany({ where: { ... }, data: { ... } })

// upsert
await prisma.user.upsert({
  where: { email: 'a@b.com' },
  update: { name: 'New' },
  create: { email: 'a@b.com', name: 'New' },
})

// atomic increment
await prisma.post.update({ where: { id: 1 }, data: { views: { increment: 1 } } })
```

### Delete
```typescript
// single
await prisma.user.delete({ where: { email: 'a@b.com' } })

// many
await prisma.user.deleteMany({ where: { ... } })

// all
await prisma.user.deleteMany({})
```

### Transaction
```typescript
const [deletePosts, deleteUser] = await prisma.$transaction([
  prisma.post.deleteMany({ where: { authorId: 7 } }),
  prisma.user.delete({ where: { id: 7 } }),
])
```

---

## Test cleanup (deleteMany all tables)

For Vitest setup, truncate all tables between tests:
```typescript
const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`
  SELECT tablename FROM pg_tables WHERE schemaname='public'
`
const tables = tablenames
  .map(({ tablename }) => tablename)
  .filter((name) => name !== '_prisma_migrations')
  .map((name) => `"public"."${name}"`)
  .join(', ')

await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
```
