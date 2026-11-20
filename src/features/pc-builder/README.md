# Build PC

Open `/vi/build-pc` or `/en/build-pc`. The builder uses live catalog variants
and the AI compatibility service; there is no runtime fixture or mock fallback.
If either upstream service is unavailable, the UI shows its normal error/retry
state instead of substituting synthetic products.

Core components and optional peripherals are separate groups. Products, brands,
prices, stock and specifications come from `catalog-service`. Preset builds and
compatibility verdicts come from `ai-service`. Variant UUIDs are the only IDs
accepted in saved builds, share links and the Ask AI handoff.

The main runtime calls are:

| Service | Endpoint | Purpose |
| --- | --- | --- |
| Catalog | `GET /catalog-service/products/snapshot` | Page and filter live products by slot category |
| Catalog | `GET /catalog-service/brands` | Load live brand filters |
| Catalog | `GET /catalog-service/product-variants/{id}` | Resolve a saved/shared variant |
| Catalog | `GET /catalog-service/products/{id}` | Resolve product data and specifications |
| AI | `GET /compatibility/prebuilt-builds` | Load live preset configurations |
| AI | `POST /compatibility/candidates` | Check candidates against selected parts |
| AI | `POST /compatibility/check` | Check the selected build, including RAM module count versus motherboard slots |

The frontend treats compatibility rule names as data. `RAM_SLOTS` is displayed
as “Số thanh RAM ↔ số khe Mainboard” in Vietnamese and “RAM modules ↔
Motherboard slots” in English. The AI service reads `kit_modules` and `ram_slots`
from catalog specifications; the browser does not recompute this rule.

Selections persist only after **Save locally** and contain variant UUIDs only.
Share links contain the same validated selection, never client-controlled prices
or specifications. Ask AI resolves those UUIDs again on the server before
building the question.

Tests may use deterministic module/fetch stubs, but test data must not be exposed
through an application route or imported by runtime code.

Verification: `yarn test:run`, `yarn lint`, `yarn typecheck`, and `yarn build`.
