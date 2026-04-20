# projects-label

White label base template for backend projects built with Node.js, Express, TypeScript and Prisma v7.

## Stack

<img align="left" alt="Node.js" title="Node.js" width="30px" style="padding-right: 10px;"
src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" />

<img align="left" alt="TypeScript" title="TypeScript" width="30px" style="padding-right: 10px;"
src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" />

<img align="left" alt="Express" title="Express" width="30px" style="padding-right: 10px;"
src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" />

<img align="left" alt="PostgreSQL" title="PostgreSQL" width="30px" style="padding-right: 10px;"
src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" />

<img align="left" alt="Prisma" title="Prisma" width="30px" style="padding-right: 10px;"
src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg" />

<br clear="left"/>

## Structure

```
root/
├── backend/    → Node.js/Express API
├── frontend/   → UI client  
└── shared/     → shared code (types, schemas, abilities)
```

## Using this template

1. Click **"Use this template"** on GitHub
2. Name your new repository
3. Clone it and start building your features on top

## Running locally

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL

### Setup

```bash
# install dependencies
pnpm install

# create your .env inside backend/
cp backend/.env.example backend/.env
# fill in DATABASE_URL, JWT_SECRET and PORT

# generate prisma client
cd backend && npx prisma generate

# run migrations
npx prisma migrate deploy

# start dev server
pnpm dev:backend

Tests

# create your .env.test inside backend/
cp backend/.env.example backend/.env.test
# fill in DATABASE_URL pointing to your test database

cd backend && pnpm test
