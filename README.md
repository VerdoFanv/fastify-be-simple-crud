# fastify-be

Fastify v5 (LTS) API with PostgreSQL (Prisma 7), JWT auth, S3/MinIO uploads, OpenAPI docs, and User/Product CRUD.

## Requirements

- Node.js >= 20
- PostgreSQL

## Path aliases

Imports use the `@/` prefix mapped to `src/`:

```ts
import { env } from '@/config/env.js'
import { AppError } from '@/lib/errors.js'
```

Configured in `tsconfig.json` (`paths`). Dev (`tsx`) resolves them directly; production build rewrites them via `tsc-alias`.

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`

JSON responses include a `performance` object:

```json
{
  "performance": {
    "durationMs": 12.5,
    "process": ["request.received", "auth.jwtVerify", "products.list.query", "products.list.respond"]
  }
}
```

`204` delete responses expose the same data via headers `x-response-duration-ms` and `x-response-process`.

### Demo credentials (after seed)

| Email | Password |
| --- | --- |
| `admin@example.com` | `Password123!` |
| `user@example.com` | `Password123!` |

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run db:seed` | Seed demo users/products |

## Docker (optional)

Infra only (default):

```bash
docker compose up -d
```

Starts Postgres + MinIO. Ports/credentials come from `.env` (see `.env.example`).

Full stack (include app image):

```bash
docker compose --profile app up -d --build
```

Create the MinIO bucket once via MinIO Console (`http://localhost:9001`) or `mc mb`.
