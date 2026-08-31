# PC Shopping Assistant — Web Frontend

Next.js 16 App Router frontend for the PC Shopping Assistant storefront.

## Local development

The frontend expects the backend API on `http://localhost:8080` and the AI
service on `http://localhost:8000`. Copy `.env.example` to `.env.local` only if
you need to override these defaults.

```bash
corepack enable
corepack yarn install
corepack yarn dev
```

Open `http://localhost:3000/vi` (or `/en`). The catalog and cart are live API
calls; there is no runtime mock data.

## API contract and BFF

Browser code calls same-origin `/api/backend/*` and `/api/ai/*` route handlers.
The handlers forward to the fixed upstream services, keep auth tokens in
HttpOnly cookies, perform one refresh retry on a backend `401`, and preserve
the exact `{data, message, errors}` response envelope. The top-level message is
always a static mapping key; request-specific details stay in `errors`.

## OpenAPI types-only workflow

Committed snapshots live in `src/lib/api/openapi/`; generated TypeScript lives
in `src/lib/api/generated/` and must not be hand edited.

```bash
# With backend and AI running locally:
corepack yarn api:refresh
corepack yarn api:generate
corepack yarn api:check
```

`openapi-typescript` generates schemas and operation/path types only. Feature
adapters use a small BFF HTTP client instead of a generated runtime client.

## Verification

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn test:run
corepack yarn build
```
