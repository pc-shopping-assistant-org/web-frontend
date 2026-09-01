# gearPC — Web Frontend

Next.js 16 App Router frontend for the gearPC PC hardware storefront.

## Local development

The frontend expects the backend API on `http://localhost:8080` and the AI
service on `http://localhost:8000`. Copy `.env.example` to `.env.local` only if
you need to override these defaults.

```bash
corepack enable
corepack yarn install
corepack yarn dev
```

Open `http://localhost:3000/vi` (or `/en`). Customer flows are live API calls;
there is no runtime mock data.

To enable Google Login, create a Google Identity Services web client and set
the same client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (browser) and backend
`GOOGLE_CLIENT_ID` (server). The backend verifies the ID token and links it to
an existing local account; local registration remains required for the phone
and address fields in this MVP.

## Implemented surfaces

- Storefront: product browse/search/filter, product detail with active variant
  gallery, review read model, and add-to-cart.
- Account: OTP registration, login/logout, password recovery/change, profile,
  normalized saved addresses and default-address selection.
- Checkout and orders: voucher validation, shipping/payment selection, order
  creation, online payment-intent boundary, order history/search/detail/status,
  cancellation and completed-order reviews.
- AI assistant: chat, semantic search, consultation, comparison and product
  evaluation at `/vi/assistant` or `/en/assistant`.
- Admin workspace: role-gated dashboard, revenue/top-selling statistics,
  catalog/customer/employee/order/discount/supplier/payment/review lists,
  detail views, invoice search, supported status mutations and the documented
  category/brand/product/variant/employee/discount/supplier CRUD surfaces under
  `/vi/admin` or `/en/admin`.

Protected pages use the HttpOnly access cookie and rely on backend role
authorization. A missing/expired session is redirected to sign in; an account
without an admin role receives a visible forbidden state.

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

## Contract organization

Runtime request validation and app-facing response aliases are colocated with
their bounded context:

```text
src/features/<context>/contracts/
  requests.ts    # Zod schemas + inferred request types
  dto.ts         # transport aliases over generated OpenAPI schemas
  responses.ts   # stable frontend-owned response model exports
  models.ts      # UI/query models; never mirror OpenAPI optionals blindly
  mappers.ts     # DTO -> model normalization at the adapter boundary
```

The current contexts are `auth`, `account`, `cart`, `orders`, `catalog`,
`assistant`, and `admin` (admin requests are split into catalog, commerce, and
analytics modules). Shared request primitives and the common response envelope
live in `src/lib/api/contracts/`, while generated OpenAPI access is isolated in
`src/lib/api/generated/types.ts`.
Generated types are intentionally confined to `contracts/dto.ts` (and request
filter aliases at the adapter boundary). API adapters map DTOs before returning
data to queries and components, so OpenAPI regeneration cannot silently change
the UI model. `src/lib/api/request-schemas.ts` and `src/lib/api/types.ts` remain
compatibility barrels for older imports; new code should import the focused
context contract.

Domain enums follow the same rule under `src/lib/domain/` and are grouped by
account, catalog, commerce, assistant, and API message keys. The old
`src/lib/domain/enums.ts` path is a compatibility barrel only.

## Verification

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn test:run
corepack yarn build
```
