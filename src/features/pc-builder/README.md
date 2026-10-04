# Build PC prototype

Open `/vi/build-pc` or `/en/build-pc`. The global header includes **Build PC**.
Preset builds are compact single-line buttons; the global demo notice is not
repeated on every preset. Header, tabs and catalog spacing favor product density.
The PC-builder API requires no backend/database/provider dependency; the shared
site shell still uses its usual backend requests.

The owner explicitly approved synthetic catalog data for this prototype.
PC components and optional peripherals are separate groups. Display, mouse,
keyboard and headset appear as discoverable add-on suggestions, not required
PC-completion slots. The quote includes both groups and shows separate subtotals.
The catalog uses keyboard-accessible **Core / Accessories** tabs with category
chips inside each panel. Switching tabs remembers the category and retains all
selections. Desktop uses a wide catalog and compact setup sidebar; the sidebar
shows selected rows grouped by component/peripheral, edit/remove controls,
separate subtotals and a total-first header. Empty slots no longer fill the sidebar.
All product cards use compact horizontal thumbnails, two key specs, price and
one select action. Core checks show a small status line; accessories have no
core-only badges, which does not imply compatibility certification. Clicking
the image/name opens a Base UI modal with full fixture specs, SKU, price and a
select action. Focus management, Escape and close behavior use the native library.
No generated OpenAPI contract exists for these mock endpoints, so local Zod
contracts validate boundaries; `models.ts` and `mappers.ts` remain UI-owned.

| API | Input | Result |
| --- | --- | --- |
| GET `/api/mock/pc-builder/components?slot=CPU` | Slot enum | SKU catalog fixtures |
| GET `/api/mock/pc-builder/accessories` | None | Optional peripheral fixtures |
| POST `/api/mock/pc-builder/quote` | `{selection: {CPU: "cpu-amd"}}` | Server total, parts, missing slots, checks |
| POST `/api/mock/pc-builder/validate` | `{selection: {}, slot: "CPU"}` | Candidate statuses in one batch |

All responses use `{data, message, errors}` with static `PC_BUILD_*` keys.
Submitted prices/extra fields and invalid slots/SKUs are rejected. Invalid
selections cannot be saved/shared via UI until a valid quote is returned.

Selections persist only on explicit **Save locally** in browser storage, never
tokens or personal information. Share links contain validated SKU selections;
they are parsed server-side for consistent initial rendering. No cart/checkout
button is provided because demo IDs do not belong to the real catalog.

Compatibility reports only what was checked; PSU, SSD interface and cooler
clearance remain unknown. Specs are synthetic, not manufacturer-certified.
Real integration and visual browser acceptance are tracked in `ISSUE-073`.

**Ask AI about this build** opens the existing chat with an editable question.
Only selected fixture IDs travel in the URL. The assistant server route validates
them and resolves prices/specs/checks from mock fixtures, labels them DEMO and
requests that unknown compatibility not be invented. Nothing is auto-sent, and
demo IDs never enter real product comparison/evaluation endpoints. Live answers
still require the configured AI service/provider; this handoff is not a solver.

Verification: `yarn test:run src/features/pc-builder`, `yarn lint`,
`yarn typecheck`, `yarn build`. Use the project-level full test suite before handoff.
