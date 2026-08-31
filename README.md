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

Open `http://localhost:3000/vi` (or `/en`). Customer flows are live API calls;
there is no runtime mock data.

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

## Verification

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn test:run
corepack yarn build
```
