# Frontend Agent Guide

This repository is the Next.js frontend for the PC Shopping Assistant project.
The repository-level guide at `../AGENTS.md` still applies.

## Stack

- Next.js 16 App Router, TypeScript, React Server Components by default.
- Yarn Modern via the pinned `packageManager` field and Corepack.
- Tailwind CSS 4 and shadcn/ui source components in `src/components/ui`.
- TanStack Query for client cache and mutations.
- `next-intl` with `/vi` and `/en` locale prefixes.
- OpenAPI types generated from committed snapshots; never hand-edit generated files.

## Boundaries

- Browser code calls same-origin `/api/backend/*` or `/api/ai/*` BFF routes only.
- Backend is the source of truth for catalog, cart, account, order and payment data.
- Keep access and refresh tokens in HttpOnly cookies. Never use localStorage for JWTs.
- Preserve the exact `{data, message, errors}` envelope and static message keys.
- Dynamic details belong in `errors[]`, not the top-level `message`.
- Use generated OpenAPI request/response types in feature adapters.
- Do not mark a use case complete from a shell or contract-only implementation.

## Next.js 16 conventions

- Use `src/proxy.ts`, not `middleware.ts`.
- Route params are async; use `await params` and the generated `PageProps`/`LayoutProps` helpers.
- Use `next/root-params` for the locale in server utilities where appropriate.
- Keep secrets server-only and validate environment variables at the BFF boundary.

## Commands

```bash
yarn dev
yarn lint
yarn typecheck
yarn test:run
yarn api:check
yarn build
```

The normal local dependencies are the backend at `http://localhost:8080` and
the AI service at `http://localhost:8000`. Runtime development does not use
mock data; tests may stub `fetch`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
